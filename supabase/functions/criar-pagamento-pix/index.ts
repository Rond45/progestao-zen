import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PLANOS, isPlanoValido, corsHeaders } from "../_shared/planos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: "Não autenticado" }, 401);
    const user = userRes.user;

    const body = await req.json().catch(() => ({}));
    const plano = String(body?.plano ?? "");
    if (!isPlanoValido(plano)) return json({ error: "Plano inválido" }, 400);
    const { nome, preco } = PLANOS[plano];

    const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpToken) return json({ error: "MP_ACCESS_TOKEN não configurado" }, 500);

    const idempotency = crypto.randomUUID();
    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotency,
      },
      body: JSON.stringify({
        transaction_amount: preco,
        description: `Assinatura ${nome} - ProGestão+`,
        payment_method_id: "pix",
        payer: { email: user.email },
        external_reference: user.id,
        metadata: { plano, user_id: user.id },
      }),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("Erro MP Pix:", mpData);
      return json({ error: "Falha ao criar Pix", details: mpData }, 502);
    }

    const qr = mpData?.point_of_interaction?.transaction_data?.qr_code ?? null;
    const qr64 = mpData?.point_of_interaction?.transaction_data?.qr_code_base64 ?? null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan_name: plano,
        metodo_pagamento: "pix",
        status: "pix_pendente",
        mp_payment_id: String(mpData.id),
        mp_payer_email: user.email,
      },
      { onConflict: "user_id" },
    );

    return json({ qr_code: qr, qr_code_base64: qr64, mp_payment_id: mpData.id });
  } catch (e) {
    console.error("criar-pagamento-pix error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}