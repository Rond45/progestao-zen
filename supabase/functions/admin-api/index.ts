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

const GRAPH = "https://graph.facebook.com/v24.0";

async function centralCreds(supabase: any) {
  const tk = Deno.env.get("WHATSAPP_CLOUD_TOKEN");
  const { data } = await supabase.from("platform_config").select("value").eq("key", "central_waba_id").maybeSingle();
  const waba = data?.value;
  if (!tk || !waba) throw new Error("Credenciais do número central ausentes (token ou WABA).");
  return { tk, waba };
}

function validateTemplate(t: any): string | null {
  if (!t?.name || !/^[a-z0-9_]+$/.test(t.name)) return "Nome inválido: use apenas letras minúsculas, números e _.";
  const body = String(t.body || "");
  if (!body.trim()) return "O corpo é obrigatório.";
  if (body.length > 1024) return "O corpo deve ter no máximo 1024 caracteres.";
  if (t.footer && String(t.footer).length > 60) return "O rodapé deve ter no máximo 60 caracteres.";
  const buttons = (t.buttons ?? []).filter((b: string) => b?.trim());
  if (buttons.length > 3) return "No máximo 3 botões.";
  if (buttons.some((b: string) => b.trim().length > 25)) return "Cada botão deve ter no máximo 25 caracteres.";
  if (!["UTILITY", "MARKETING", "AUTHENTICATION"].includes(t.category || "UTILITY")) return "Categoria inválida.";
  const trimmed = body.trim();
  if (/^\{\{\d+\}\}/.test(trimmed) || /\{\{\d+\}\}$/.test(trimmed.replace(/[.!?]+$/, "")) && /\{\{\d+\}\}$/.test(trimmed)) {
    return "O corpo não pode começar nem terminar com uma variável.";
  }
  if (/\{\{\d+\}\}\s*\{\{\d+\}\}/.test(body)) return "Variáveis não podem ficar coladas uma na outra.";
  const nums = [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  const max = nums.length ? Math.max(...nums) : 0;
  for (let i = 1; i <= max; i++) if (!nums.includes(i)) return `Variável {{${i}}} ausente: numere em sequência.`;
  const ex = Array.isArray(t.body_examples) ? t.body_examples : [];
  if (ex.length < max || ex.slice(0, max).some((e: string) => !String(e ?? "").trim())) {
    return "Informe um exemplo para cada variável.";
  }
  t.body_examples = ex.slice(0, max).map((e: string) => String(e).trim());
  return null;
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
          .select("business_id, phone_number, ai_name, status, instance_name, qr_code, is_on_biz_app, phone_number_id");
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
            is_on_biz_app: !!conn?.is_on_biz_app,
            phone_number_id: conn?.phone_number_id || null,
            has_connection: !!conn,
          };
        });
        return json(result);
      }

      case "create-instance": {
        const { business_id } = params;
        // Credentials live only in server secrets, never in the database
        const evolutionUrlRaw = Deno.env.get("EVOLUTION_API_URL");
        const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
        if (!evolutionUrlRaw || !evolutionKey) {
          return json({ error: "Evolution API não configurada no servidor." }, 500);
        }
        const evolutionUrl = evolutionUrlRaw.replace(/\/$/, "");

        // Get business name for slug
        const { data: biz } = await supabase.from("businesses").select("name").eq("id", business_id).single();
        const instance_name = slugify(biz?.name || business_id);

        // Create instance on Evolution API
        const createRes = await fetch(`${evolutionUrl}/instance/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: evolutionKey },
          body: JSON.stringify({ instanceName: instance_name, integration: "WHATSAPP-BAILEYS" }),
        });
        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error("Evolution create error:", errText);
        }

        // Wait 2 seconds for instance to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get QR code
        const qrRes = await fetch(`${evolutionUrl}/instance/connect/${instance_name}`, {
          headers: { apikey: evolutionKey },
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
              openai_model: "gpt-4o-mini",
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
          .select("instance_name")
          .eq("business_id", business_id)
          .single();

        const evoUrl = Deno.env.get("EVOLUTION_API_URL")?.replace(/\/$/, "");
        const evoKey = Deno.env.get("EVOLUTION_API_KEY");
        if (conn?.instance_name && evoUrl && evoKey) {
          try {
            await fetch(
              `${evoUrl}/instance/logout/${conn.instance_name}`,
              { method: "DELETE", headers: { apikey: evoKey } }
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

      // ===== Número central / modelos de mensagem (Cloud API) =====
      case "central-status": {
        const tk = Deno.env.get("WHATSAPP_CLOUD_TOKEN");
        const pnid = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        if (!tk || !pnid) return json({ token_ok: false, error: "Credenciais do número central ausentes." });
        const r = await fetch(`${GRAPH}/${pnid}?fields=display_phone_number,verified_name,quality_rating,name_status,status`, {
          headers: { Authorization: `Bearer ${tk}` },
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) return json({ token_ok: false, error: out?.error?.message || `HTTP ${r.status}` });
        return json({
          token_ok: true,
          display_phone_number: out.display_phone_number ?? null,
          verified_name: out.verified_name ?? null,
          quality_rating: out.quality_rating ?? null,
          name_status: out.name_status ?? null,
          status: out.status ?? null,
        });
      }

      case "list-templates": {
        const { data, error } = await supabase.from("whatsapp_templates").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        return json(data ?? []);
      }

      case "save-template": {
        const t = params.template ?? {};
        const v = validateTemplate(t);
        if (v) return json({ error: v }, 400);
        const row = {
          name: t.name,
          language: t.language || "pt_BR",
          category: t.category || "UTILITY",
          body: t.body,
          footer: t.footer?.trim() ? t.footer.trim() : null,
          buttons: (t.buttons ?? []).filter((b: string) => b?.trim()).map((b: string) => b.trim()),
          body_examples: t.body_examples ?? [],
        };
        if (t.id) {
          const { data: cur } = await supabase.from("whatsapp_templates").select("status").eq("id", t.id).maybeSingle();
          if (cur && cur.status !== "draft" && cur.status !== "rejected") {
            return json({ error: "Somente rascunhos ou modelos rejeitados podem ser editados." }, 400);
          }
          const { error } = await supabase.from("whatsapp_templates").update({ ...row, status: "draft" }).eq("id", t.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("whatsapp_templates").insert(row);
          if (error) return json({ error: error.code === "23505" ? "Já existe um modelo com esse nome." : error.message }, 400);
        }
        return json({ success: true });
      }

      case "submit-template": {
        const { data: t } = await supabase.from("whatsapp_templates").select("*").eq("id", params.id).maybeSingle();
        if (!t) return json({ error: "Modelo não encontrado." }, 404);
        const { waba, tk } = await centralCreds(supabase);
        const components: any[] = [{
          type: "BODY",
          text: t.body,
          ...(Array.isArray(t.body_examples) && t.body_examples.length ? { example: { body_text: [t.body_examples] } } : {}),
        }];
        if (t.footer) components.push({ type: "FOOTER", text: t.footer });
        if (Array.isArray(t.buttons) && t.buttons.length) {
          components.push({ type: "BUTTONS", buttons: t.buttons.map((b: string) => ({ type: "QUICK_REPLY", text: b })) });
        }
        const r = await fetch(`${GRAPH}/${waba}/message_templates`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
          body: JSON.stringify({ name: t.name, language: t.language, category: t.category, components }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) {
          const msg = out?.error?.error_user_msg || out?.error?.message || `HTTP ${r.status}`;
          return json({ error: `Meta: ${msg}` }, 400);
        }
        await supabase.from("whatsapp_templates").update({
          meta_template_id: out.id ?? null,
          status: String(out.status || "PENDING").toLowerCase() === "approved" ? "approved" : "pending",
          rejection_reason: null,
        }).eq("id", t.id);
        return json({ success: true, meta_template_id: out.id ?? null });
      }

      case "sync-template-status": {
        const { data: t } = await supabase.from("whatsapp_templates").select("*").eq("id", params.id).maybeSingle();
        if (!t) return json({ error: "Modelo não encontrado." }, 404);
        const { waba, tk } = await centralCreds(supabase);
        const r = await fetch(`${GRAPH}/${waba}/message_templates?name=${encodeURIComponent(t.name)}&fields=name,status,id,rejected_reason`, {
          headers: { Authorization: `Bearer ${tk}` },
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) return json({ error: `Meta: ${out?.error?.message || `HTTP ${r.status}`}` }, 400);
        const remote = (out.data ?? []).find((x: any) => x.name === t.name && (!t.language || true));
        if (!remote) return json({ status: t.status, found: false });
        const map: Record<string, string> = { APPROVED: "approved", REJECTED: "rejected", PENDING: "pending", PAUSED: "paused", DISABLED: "paused", IN_APPEAL: "pending" };
        const st = map[String(remote.status).toUpperCase()] || t.status;
        await supabase.from("whatsapp_templates").update({
          status: st,
          meta_template_id: remote.id ?? t.meta_template_id,
          rejection_reason: remote.rejected_reason && remote.rejected_reason !== "NONE" ? remote.rejected_reason : null,
        }).eq("id", t.id);
        return json({ status: st, found: true });
      }

      case "delete-template": {
        const { data: t } = await supabase.from("whatsapp_templates").select("*").eq("id", params.id).maybeSingle();
        if (!t) return json({ error: "Modelo não encontrado." }, 404);
        if (t.meta_template_id) {
          const { waba, tk } = await centralCreds(supabase);
          const r = await fetch(`${GRAPH}/${waba}/message_templates?name=${encodeURIComponent(t.name)}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${tk}` },
          });
          if (!r.ok) {
            const out = await r.json().catch(() => ({}));
            return json({ error: `Meta: ${out?.error?.error_user_msg || out?.error?.message || `HTTP ${r.status}`}` }, 400);
          }
        }
        await supabase.from("whatsapp_templates").delete().eq("id", t.id);
        return json({ success: true });
      }

      case "send-test-template": {
        const { template_name, to_phone } = params;
        const d = String(to_phone || "").replace(/\D/g, "");
        const to = d.length === 10 || d.length === 11 ? "55" + d : d.startsWith("55") && (d.length === 12 || d.length === 13) ? d : null;
        if (!to) return json({ error: "Telefone inválido." }, 400);
        const { data: t } = await supabase.from("whatsapp_templates").select("*").eq("name", template_name).maybeSingle();
        if (!t) return json({ error: "Modelo não encontrado." }, 404);
        if (t.status !== "approved") return json({ error: "O modelo precisa estar aprovado pela Meta para envio." }, 400);
        const tk = Deno.env.get("WHATSAPP_CLOUD_TOKEN");
        const pnid = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        if (!tk || !pnid) return json({ error: "Credenciais do número central ausentes." }, 500);
        const components: any[] = [];
        const ex = Array.isArray(t.body_examples) ? t.body_examples : [];
        if (ex.length) components.push({ type: "body", parameters: ex.map((x: string) => ({ type: "text", text: String(x) })) });
        (Array.isArray(t.buttons) ? t.buttons : []).forEach((_b: string, i: number) => {
          components.push({ type: "button", sub_type: "quick_reply", index: String(i), parameters: [{ type: "payload", payload: `TEST:${i}` }] });
        });
        const r = await fetch(`${GRAPH}/${pnid}/messages`, {
          method: "POST",
          headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: { name: t.name, language: { code: t.language }, components },
          }),
        });
        const out = await r.json().catch(() => ({}));
        if (!r.ok) return json({ error: `Meta: ${out?.error?.error_data?.details || out?.error?.message || `HTTP ${r.status}`}` }, 400);
        return json({ success: true, message_id: out?.messages?.[0]?.id ?? null });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("Admin API error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
