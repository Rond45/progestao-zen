import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "rondineliprof@gmail.com";
const ADMIN_PASSWORD = "12345678";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, admin_email, admin_password, ...params } = body;

    if (admin_email !== ADMIN_EMAIL || admin_password !== ADMIN_PASSWORD) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (action) {
      case "get-overview": {
        const { data: businesses } = await supabase.from("businesses").select("id, vertical, created_at");
        const { data: wConn } = await supabase.from("whatsapp_connections").select("business_id, status");
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const total = businesses?.length ?? 0;
        const whatsapp_active = wConn?.filter((w: any) => w.status === "connected").length ?? 0;
        const new_this_month = businesses?.filter((b: any) => b.created_at >= monthStart).length ?? 0;
        const barbearias = businesses?.filter((b: any) => b.vertical === "barbearia").length ?? 0;
        const saloes = businesses?.filter((b: any) => b.vertical === "salao").length ?? 0;
        return json({ total, whatsapp_active, new_this_month, barbearias, saloes });
      }

      case "get-clients": {
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, name, vertical, created_at")
          .order("created_at", { ascending: false });
        const { data: wConn } = await supabase
          .from("whatsapp_connections")
          .select("business_id, status");
        const statusMap = new Map((wConn ?? []).map((w: any) => [w.business_id, w.status]));
        const result = (businesses ?? []).map((b: any) => ({
          ...b,
          whatsapp_status: statusMap.get(b.id) || "disconnected",
        }));
        return json(result);
      }

      case "get-platform-config": {
        const { data } = await supabase.from("platform_config").select("key, value");
        const config: Record<string, string> = {};
        (data ?? []).forEach((r: any) => { config[r.key] = r.value; });
        return json({ config });
      }

      case "save-platform-config": {
        const { config } = params;
        for (const [key, value] of Object.entries(config as Record<string, string>)) {
          await supabase
            .from("platform_config")
            .upsert({ key, value: value || "", updated_at: new Date().toISOString() }, { onConflict: "key" });
        }
        return json({ success: true });
      }

      case "get-instances": {
        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, name, vertical, created_at")
          .order("name");
        const { data: connections } = await supabase
          .from("whatsapp_connections")
          .select("business_id, phone_number, ai_name, status, instance_name, qr_code");
        const connMap = new Map((connections ?? []).map((c: any) => [c.business_id, c]));
        const result = (businesses ?? []).map((b: any) => {
          const conn = connMap.get(b.id);
          return {
            business_id: b.id,
            business_name: b.name,
            vertical: b.vertical,
            phone_number: conn?.phone_number || null,
            ai_name: conn?.ai_name || null,
            status: conn?.status || null,
            instance_name: conn?.instance_name || null,
            qr_code: conn?.qr_code || null,
            has_connection: !!conn,
          };
        });
        return json(result);
      }

      case "create-instance": {
        const { business_id } = params;
        // Get global config
        const { data: cfgRows } = await supabase.from("platform_config").select("key, value");
        const cfg: Record<string, string> = {};
        (cfgRows ?? []).forEach((r: any) => { cfg[r.key] = r.value; });

        if (!cfg.evolution_api_url || !cfg.evolution_api_key) {
          return json({ error: "Configure a URL e API Key da Evolution API primeiro." }, 400);
        }

        // Get business name for slug
        const { data: biz } = await supabase.from("businesses").select("name").eq("id", business_id).single();
        const instance_name = slugify(biz?.name || business_id);

        // Create instance on Evolution API
        const createRes = await fetch(`${cfg.evolution_api_url}/instance/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: cfg.evolution_api_key },
          body: JSON.stringify({ instanceName: instance_name, integration: "WHATSAPP-BAILEYS" }),
        });
        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error("Evolution create error:", errText);
        }

        // Wait 2 seconds for instance to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get QR code
        const qrRes = await fetch(`${cfg.evolution_api_url}/instance/connect/${instance_name}`, {
          headers: { apikey: cfg.evolution_api_key },
        });
        let qr_code = null;
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qr_code = qrData?.base64 || qrData?.qrcode?.base64 || null;
        }

        // Upsert connection
        await supabase
          .from("whatsapp_connections")
          .upsert(
            {
              business_id,
              instance_name,
              status: "pending",
              qr_code,
              evolution_api_url: cfg.evolution_api_url,
              evolution_api_key: cfg.evolution_api_key,
              openai_api_key: cfg.openai_api_key || null,
              openai_model: cfg.openai_model || "gpt-4o-mini",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "business_id" }
          );

        return json({ success: true, qr_code, instance_name });
      }

      case "disconnect-instance": {
        const { business_id } = params;
        const { data: conn } = await supabase
          .from("whatsapp_connections")
          .select("instance_name, evolution_api_url, evolution_api_key")
          .eq("business_id", business_id)
          .single();

        if (conn?.instance_name && conn?.evolution_api_url && conn?.evolution_api_key) {
          try {
            await fetch(
              `${conn.evolution_api_url}/instance/logout/${conn.instance_name}`,
              { method: "DELETE", headers: { apikey: conn.evolution_api_key } }
            );
          } catch (e) {
            console.error("Logout error:", e);
          }
        }

        await supabase
          .from("whatsapp_connections")
          .update({ status: "disconnected", qr_code: null, updated_at: new Date().toISOString() })
          .eq("business_id", business_id);

        return json({ success: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("Admin API error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
