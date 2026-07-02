import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/planos.ts";

const MP_API = "https://api.mercadopago.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const mpToken = Deno.env.get("MP_ACCESS_TOKEN");

  try {
    const url = new URL(req.url);
    let type = url.searchParams.get("type") ?? url.searchParams.get("topic");
    let id = url.searchParams.get("id") ?? url.searchParams.get("data.id");

    if (req.method !== "GET") {
      const raw = await req.text();
      if (raw) {
        try {
          const body = JSON.parse(raw);
          type = type ?? body?.type ?? body?.topic ?? null;
          id = id ?? body?.data?.id ?? body?.resource ?? body?.id ?? null;
          if (typeof id === "string" && id.includes("/")) {
            id = id.split("/").filter(Boolean).pop() ?? null;
          }
        } catch (_) { /* ignore */ }
      }
    }

    console.log("MP webhook:", { type, id });

    if (!mpToken || !type || !id) {
      return new Response("ok", { status: 200 });
    }

    if (type === "payment" || type === "payment.updated" || type === "payment.created") {
      await handlePayment(admin, mpToken, String(id));
    } else if (type.startsWith("preapproval") || type === "subscription_preapproval") {
      await handlePreapproval(admin, mpToken, String(id));
    } else if (
      type === "subscription_authorized_payment" ||
      type === "authorized_payment"
    ) {
      await handleAuthorizedPayment(admin, mpToken, String(id));
    } else {
      console.log("Evento ignorado:", type);
    }
  } catch (e) {
    console.error("webhook-mercadopago error:", e);
  }

  return new Response("ok", { status: 200 });
});

async function mpGet(path: string, token: string) {
  const r = await fetch(`${MP_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    console.error("MP GET falhou:", path, r.status, await r.text());
    return null;
  }
  return await r.json();
}

async function handlePayment(admin: any, token: string, id: string) {
  const p = await mpGet(`/v1/payments/${id}`, token);
  if (!p) return;
  const userId = p.external_reference || p?.metadata?.user_id;
  if (!userId) return;

  const { data: existing } = await admin
    .from("subscriptions")
    .select("mp_payment_id, status, acesso_valido_ate")
    .eq("user_id", userId)
    .maybeSingle();

  if (p.status === "approved") {
    // Idempotência: se já ativou com este mesmo payment id, não repetir.
    if (
      existing?.mp_payment_id === String(id) &&
      existing?.status === "active" &&
      existing?.acesso_valido_ate &&
      new Date(existing.acesso_valido_ate) > new Date()
    ) {
      console.log("Payment já processado (idempotente):", id);
      return;
    }
    const validoAte = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("subscriptions").update({
      status: "active",
      metodo_pagamento: "pix",
      mp_payment_id: String(id),
      acesso_valido_ate: validoAte,
    }).eq("user_id", userId);
  } else if (["cancelled", "rejected", "refunded", "charged_back"].includes(p.status)) {
    if (existing?.status !== "active") {
      await admin.from("subscriptions").update({ status: "pix_pendente" }).eq("user_id", userId);
    }
  }
}

async function handlePreapproval(admin: any, token: string, id: string) {
  const pa = await mpGet(`/preapproval/${id}`, token);
  if (!pa) return;
  const userId = pa.external_reference;
  if (!userId) return;

  if (pa.status === "authorized") {
    const validoAte = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
    await admin.from("subscriptions").update({
      status: "active",
      metodo_pagamento: "cartao",
      mp_preapproval_id: String(id),
      acesso_valido_ate: validoAte,
    }).eq("user_id", userId);
  } else if (pa.status === "cancelled" || pa.status === "paused") {
    await admin.from("subscriptions").update({ status: "canceled" }).eq("user_id", userId);
  }
}

async function handleAuthorizedPayment(admin: any, token: string, id: string) {
  const ap = await mpGet(`/authorized_payments/${id}`, token);
  if (!ap) return;
  const preapprovalId = ap.preapproval_id;
  if (!preapprovalId || ap.status !== "approved") return;

  const { data: sub } = await admin
    .from("subscriptions")
    .select("user_id, acesso_valido_ate")
    .eq("mp_preapproval_id", String(preapprovalId))
    .maybeSingle();
  if (!sub) return;

  const base = sub.acesso_valido_ate && new Date(sub.acesso_valido_ate) > new Date()
    ? new Date(sub.acesso_valido_ate)
    : new Date();
  const novo = new Date(base.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString();
  await admin.from("subscriptions").update({
    status: "active",
    acesso_valido_ate: novo,
  }).eq("user_id", sub.user_id);
}