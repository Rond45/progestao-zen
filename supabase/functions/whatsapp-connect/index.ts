import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchQrWithRetry(baseUrl: string, apiKey: string, instanceName: string, maxRetries = 5): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    try {
      const res = await fetch(`${baseUrl}/instance/connect/${instanceName}`, {
        method: "GET",
        headers: { apikey: apiKey },
      });
      const data = await res.json();
      console.log(`QR attempt ${i + 1}:`, JSON.stringify(data).substring(0, 200));
      const qr = data?.base64 || data?.qrcode?.base64 || data?.code || null;
      if (qr && typeof qr === "string" && qr.length > 50) {
        return qr;
      }
    } catch (e) {
      console.log(`QR attempt ${i + 1} error:`, e);
    }
  }
  return null;
}

async function setInstanceWebhook(baseUrl: string, apiKey: string, instanceName: string, webhookUrl: string) {
  try {
    const res = await fetch(`${baseUrl}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          webhookByEvents: false,
          webhookBase64: false,
          events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
        },
        // Fallback flat shape for older Evolution builds
        enabled: true,
        url: webhookUrl,
        webhookByEvents: false,
        events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE"],
      }),
    });
    const txt = await res.text();
    console.log(`webhook/set status=${res.status}:`, txt.substring(0, 300));
  } catch (e) {
    console.log("webhook/set error:", e);
  }
}

async function fetchPairingCode(baseUrl: string, apiKey: string, instanceName: string, phoneNumber: string): Promise<string | null> {
  try {
    const url = `${baseUrl}/instance/connect/${instanceName}?number=${encodeURIComponent(phoneNumber)}`;
    const res = await fetch(url, { method: "GET", headers: { apikey: apiKey } });
    const data = await res.json();
    console.log("pairing code response:", JSON.stringify(data).substring(0, 300));
    return data?.pairingCode || data?.code || null;
  } catch (e) {
    console.log("pairing code error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_id, phone_number } = await req.json();

    if (!business_id) {
      return new Response(JSON.stringify({ error: "business_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const evolution_api_url = Deno.env.get("EVOLUTION_API_URL");
    const evolution_api_key = Deno.env.get("EVOLUTION_API_KEY");
    if (!evolution_api_url || !evolution_api_key) {
      return new Response(JSON.stringify({ error: "Evolution API não configurada no servidor." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = evolution_api_url.replace(/\/$/, "");
    const instance_name = `biz_${String(business_id).replace(/-/g, "")}`;

    // 1. Create instance
    try {
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolution_api_key },
        body: JSON.stringify({
          instanceName: instance_name,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      const createData = await createRes.json();
      console.log("Instance create response:", JSON.stringify(createData).substring(0, 300));
    } catch (e) {
      console.log("Instance create (may already exist):", e);
    }

    // 2. Register instance webhook -> whatsapp-webhook (critical for AI to receive messages)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!.replace(/\/$/, "");
    const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;
    await setInstanceWebhook(baseUrl, evolution_api_key, instance_name, webhookUrl);

    // 3. Pairing code path if phone_number was provided
    let pairingCode: string | null = null;
    let qrCode: string | null = null;
    if (phone_number) {
      const digits = String(phone_number).replace(/\D/g, "");
      pairingCode = await fetchPairingCode(baseUrl, evolution_api_key, instance_name, digits);
    } else {
      // QR path: retry fetching QR Code up to 5 times with 3s delay
      qrCode = await fetchQrWithRetry(baseUrl, evolution_api_key, instance_name, 5);
    }

    // 3. Save to DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase
      .from("whatsapp_connections")
      .upsert(
        {
          business_id,
          instance_name,
          status: "pending",
          qr_code: qrCode,
          phone_number: phone_number ? String(phone_number).replace(/\D/g, "") : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id" }
      );

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Erro ao salvar no banco" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response: any = { success: true, qr_code: qrCode, pairing_code: pairingCode, instance_name };
    if (!qrCode && !pairingCode) {
      response.message = "Instância criada. Tente novamente em instantes.";
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-connect error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
