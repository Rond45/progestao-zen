import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: evolution_api_key },
        body: JSON.stringify({
          instanceName: instance_name,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
    } catch (e) {
      // Instance may already exist, continue to connect
      console.log("Instance create response (may already exist):", e);
    }

    // 2. Get QR Code
    const qrRes = await fetch(`${baseUrl}/instance/connect/${instance_name}`, {
      method: "GET",
      headers: { apikey: evolution_api_key },
    });

    const qrData = await qrRes.json();
    const qrCode = qrData?.base64 || qrData?.qrcode?.base64 || qrData?.code || null;

    // 3. Upsert in DB
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
        status: qrCode ? "pending" : "connected",
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

    return new Response(JSON.stringify({ success: true, qr_code: qrCode }), {
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
