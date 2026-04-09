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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { evolution_api_url, evolution_api_key, instance_name, business_id } = await req.json();

    if (!evolution_api_url || !evolution_api_key || !instance_name || !business_id) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = evolution_api_url.replace(/\/$/, "");

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

    // 2. Retry fetching QR Code up to 5 times with 3s delay
    const qrCode = await fetchQrWithRetry(baseUrl, evolution_api_key, instance_name, 5);

    // 3. Save to DB
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbError } = await supabase
      .from("whatsapp_connections")
      .update({
        evolution_api_url: baseUrl,
        evolution_api_key,
        instance_name,
        status: qrCode ? "pending" : "pending",
        qr_code: qrCode,
        updated_at: new Date().toISOString(),
      })
      .eq("business_id", business_id);

    if (dbError) {
      console.error("DB error:", dbError);
      return new Response(JSON.stringify({ error: "Erro ao salvar no banco" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response: any = { success: true, qr_code: qrCode };
    if (!qrCode) {
      response.message = "Instância criada. Clique em Ver QR Code para gerar.";
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
