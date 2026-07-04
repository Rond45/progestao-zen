import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || isAdmin !== true) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const { action, ...params } = body;

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
        const [{ count: appointments_total }, { count: messages_total }, { count: clients_total }] = await Promise.all([
          supabase.from("appointments").select("*", { count: "exact", head: true }),
          supabase.from("messages").select("*", { count: "exact", head: true }),
          supabase.from("clients").select("*", { count: "exact", head: true }),
        ]);
        return json({
          total,
          whatsapp_active,
          new_this_month,
          barbearias,
          saloes,
          appointments_total: appointments_total ?? 0,
          messages_total: messages_total ?? 0,
          clients_total: clients_total ?? 0,
        });
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

      // ===== Anúncios =====
      case "list-anuncios": {
        const { data } = await supabase
          .from("anuncios")
          .select("*")
          .order("created_at", { ascending: false });
        return json(data ?? []);
      }
      case "create-anuncio": {
        const { titulo, imagem_url, link_checkout, segmento, ativo } = params;
        const { data, error } = await supabase
          .from("anuncios")
          .insert({ titulo, imagem_url, link_checkout, segmento, ativo: ativo ?? true })
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      case "toggle-anuncio": {
        const { id, ativo } = params;
        await supabase.from("anuncios").update({ ativo }).eq("id", id);
        return json({ success: true });
      }
      case "delete-anuncio": {
        const { id } = params;
        await supabase.from("anuncios").delete().eq("id", id);
        return json({ success: true });
      }

      // ===== Avisos globais =====
      case "list-avisos": {
        const { data } = await supabase
          .from("avisos_globais")
          .select("*")
          .order("created_at", { ascending: false });
        return json(data ?? []);
      }
      case "create-aviso": {
        const { mensagem, tipo, ativo } = params;
        const { data, error } = await supabase
          .from("avisos_globais")
          .insert({ mensagem, tipo: tipo || "info", ativo: ativo ?? true })
          .select()
          .single();
        if (error) return json({ error: error.message }, 400);
        return json(data);
      }
      case "toggle-aviso": {
        const { id, ativo } = params;
        await supabase.from("avisos_globais").update({ ativo }).eq("id", id);
        return json({ success: true });
      }
      case "delete-aviso": {
        const { id } = params;
        await supabase.from("avisos_globais").delete().eq("id", id);
        return json({ success: true });
      }

      // ===== Assinaturas =====
      case "list-assinaturas": {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("id, user_id, plan_name, status, metodo_pagamento, acesso_valido_ate, current_period_end, created_at")
          .order("created_at", { ascending: false });
        // Attach business/profile info per user
        const userIds = (subs ?? []).map((s: any) => s.user_id);
        const { data: profiles } = userIds.length
          ? await supabase.from("profiles").select("user_id, name, business_id, businesses(name, vertical)").in("user_id", userIds)
          : { data: [] as any[] };
        const pMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
        const now = Date.now();
        const enriched = (subs ?? []).map((s: any) => {
          const p: any = pMap.get(s.user_id);
          const vencido = s.acesso_valido_ate ? new Date(s.acesso_valido_ate).getTime() < now : false;
          return {
            ...s,
            owner_name: p?.name ?? null,
            business_name: p?.businesses?.name ?? null,
            vertical: p?.businesses?.vertical ?? null,
            vencido,
          };
        });
        // Totais
        const trialing = enriched.filter((s) => s.status === "trialing" && !s.vencido).length;
        const ativos = enriched.filter((s) => s.status === "active").length;
        const vencidos = enriched.filter((s) => s.vencido || s.status === "past_due" || s.status === "canceled").length;
        // Get plan pricing from platform_config
        const { data: cfgRows } = await supabase.from("platform_config").select("key, value");
        const cfg: Record<string, string> = {};
        (cfgRows ?? []).forEach((r: any) => { cfg[r.key] = r.value; });
        const preco = {
          basico: parseFloat(cfg.plan_basico_price || "39"),
          pro: parseFloat(cfg.plan_pro_price || "79"),
          premium: parseFloat(cfg.plan_premium_price || "149"),
        };
        const receita_mensal = enriched
          .filter((s) => s.status === "active")
          .reduce((sum, s) => sum + (preco[s.plan_name as keyof typeof preco] || 0), 0);
        return json({ subs: enriched, totais: { trialing, ativos, vencidos, receita_mensal } });
      }

      // ===== Plans config =====
      case "get-plans-config": {
        const { data } = await supabase.from("platform_config").select("key, value").like("key", "plan_%");
        const cfg: Record<string, string> = {};
        (data ?? []).forEach((r: any) => { cfg[r.key] = r.value; });
        return json({
          plan_basico_price: cfg.plan_basico_price || "39",
          plan_pro_price: cfg.plan_pro_price || "79",
          plan_premium_price: cfg.plan_premium_price || "149",
          plan_basico_prof: cfg.plan_basico_prof || "2",
          plan_pro_prof: cfg.plan_pro_prof || "4",
          plan_premium_prof: cfg.plan_premium_prof || "9999",
        });
      }
      case "save-plans-config": {
        const { config } = params;
        for (const [key, value] of Object.entries(config as Record<string, string>)) {
          await supabase
            .from("platform_config")
            .upsert({ key, value: String(value ?? ""), updated_at: new Date().toISOString() }, { onConflict: "key" });
        }
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
