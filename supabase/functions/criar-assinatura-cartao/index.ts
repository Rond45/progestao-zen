import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PLANOS, isPlanoValido, corsHeaders } from "../_shared/planos.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Não autenticado" }, 401);

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

    const origin = req.headers.get("origin") ?? "https://progestao.mrss.com.br";

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reason: `Assinatura ${nome} - ProGestão+`,
        external_reference: user.id,
        payer_email: user.email,
        back_url: `${origin}/dashboard/planos`,
        status: "pending",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: preco,
          currency_id: "BRL",
        },
      }),
    });
    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      console.error("Erro MP Preapproval:", mpData);
      return json({ error: "Falha ao criar assinatura", details: mpData }, 502);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    await admin.from("subscriptions").upsert(
      {
        user_id: user.id,
        plan_name: plano,
        metodo_pagamento: "cartao",
        status: "incomplete",
        mp_preapproval_id: String(mpData.id),
        mp_payer_email: user.email,
      },
      { onConflict: "user_id" },
    );

    return json({ init_point: mpData.init_point, mp_preapproval_id: mpData.id });
  } catch (e) {
    console.error("criar-assinatura-cartao error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}