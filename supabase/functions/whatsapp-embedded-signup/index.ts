import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GRAPH = "https://graph.facebook.com/v21.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Nao autenticado." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Sessao invalida." }, 401);
    }

    const body = await req.json().catch(() => null);
    const business_id = String(body?.business_id ?? "").trim();
    const code = String(body?.code ?? "").trim();
    const waba_id = String(body?.waba_id ?? "").trim();
    const phone_number_id = String(body?.phone_number_id ?? "").trim();

    if (!business_id || !code || !waba_id || !phone_number_id) {
      return json(
        { error: "Campos obrigatorios: business_id, code, waba_id, phone_number_id." },
        400,
      );
    }

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Garante que o usuario pertence ao negocio informado
    const { data: profile } = await admin
      .from("profiles")
      .select("business_id")
      .eq("user_id", userData.user.id)
      .eq("business_id", business_id)
      .maybeSingle();
    if (!profile) {
      return json({ error: "Acesso negado a este negocio." }, 403);
    }

    const appId = Deno.env.get("WHATSAPP_APP_ID");
    const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
    if (!appId || !appSecret) {
      return json(
        { error: "Configuracao ausente: WHATSAPP_APP_ID / WHATSAPP_APP_SECRET." },
        500,
      );
    }

    // 1) Troca do code por access_token
    const tokenUrl =
      `${GRAPH}/oauth/access_token?client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}&code=${encodeURIComponent(code)}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenJson = await tokenRes.json().catch(() => ({}));
    const accessToken: string | undefined = tokenJson?.access_token;
    if (!tokenRes.ok || !accessToken) {
      console.error("[SIGNUP] Falha ao trocar code por token:", tokenRes.status, JSON.stringify(tokenJson).slice(0, 400));
      return json({ error: "Nao foi possivel validar a autorizacao da Meta." }, 400);
    }

    // 2) Registro do numero (idempotente: numero ja registrado nao e erro fatal)
    let registered = false;
    let registerWarning: string | null = null;
    try {
      const regRes = await fetch(`${GRAPH}/${encodeURIComponent(phone_number_id)}/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ messaging_product: "whatsapp", pin: "000000" }),
      });
      const regJson = await regRes.json().catch(() => ({}));
      if (regRes.ok && regJson?.success !== false) {
        registered = true;
      } else {
        registerWarning = regJson?.error?.message ?? `status ${regRes.status}`;
        console.warn("[SIGNUP] Registro do numero nao concluido:", registerWarning);
      }
    } catch (e) {
      registerWarning = String(e);
      console.warn("[SIGNUP] Erro no registro do numero:", registerWarning);
    }

    // 3) Assina nosso app na WABA do cliente
    const subRes = await fetch(`${GRAPH}/${encodeURIComponent(waba_id)}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const subJson = await subRes.json().catch(() => ({}));
    if (!subRes.ok || subJson?.success === false) {
      console.error("[SIGNUP] Falha ao assinar app na WABA:", subRes.status, JSON.stringify(subJson).slice(0, 400));
      return json({ error: "Nao foi possivel conectar a conta do WhatsApp ao sistema." }, 400);
    }

    // 4) Salva a conexao
    const now = new Date().toISOString();
    const { error: upErr } = await admin
      .from("whatsapp_connections")
      .upsert(
        {
          business_id,
          status: "connected",
          phone_number_id,
          waba_id,
          access_token: accessToken,
          connected_at: now,
          updated_at: now,
        },
        { onConflict: "business_id" },
      );
    if (upErr) {
      console.error("[SIGNUP] Erro ao salvar conexao:", upErr.message);
      return json({ error: "Erro ao salvar a conexao." }, 500);
    }

    return json({ success: true, phone_number_id, registered, register_warning: registerWarning });
  } catch (e) {
    console.error("[SIGNUP] Erro inesperado:", e);
    return json({ error: "Erro inesperado ao conectar o WhatsApp." }, 500);
  }
});