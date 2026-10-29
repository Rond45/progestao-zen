import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/planos.ts";

const TEMPLATE_NAME = "lembrete_agendamento_v1";
const TZ = "America/Sao_Paulo";
const MAX_PER_RUN = 50;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export function normalizeBrPhone(raw: string | null | undefined): string | null {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return "55" + d;
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
  return null;
}

function spHour(date: Date): number {
  const h = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hour12: false }).format(date);
  return Number(h) % 24;
}

function formatDate(date: Date): string {
  const weekday = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long" }).format(date);
  const dm = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit" }).format(date);
  return `${weekday}, ${dm}`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function monthStartSp(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(now); // YYYY-MM
  return new Date(`${parts}-01T00:00:00-03:00`).toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const counts = { sent: 0, skipped: 0, failed: 0 };
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const now = new Date();

    const hour = spHour(now);
    if (hour < 8 || hour >= 20) {
      console.log(`[LEMBRETES] Fora da janela (hora SP=${hour}). Aguardando próximo ciclo.`);
      return json({ ok: true, quiet_hours: true, ...counts });
    }

    const { data: tpl } = await supabase.from("whatsapp_templates").select("name, status, language").eq("name", TEMPLATE_NAME).maybeSingle();
    if (!tpl || tpl.status !== "approved") {
      console.log(`[LEMBRETES] Modelo ${TEMPLATE_NAME} não aprovado (status=${tpl?.status ?? "inexistente"}). Nada enviado.`);
      return json({ ok: true, template_not_approved: true, ...counts });
    }

    const token = Deno.env.get("WHATSAPP_CLOUD_TOKEN");
    const pnid = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    if (!token || !pnid) throw new Error("WHATSAPP_CLOUD_TOKEN ou WHATSAPP_PHONE_NUMBER_ID ausente");

    const { data: businesses } = await supabase
      .from("businesses").select("id, name, reminder_hours_before").eq("reminders_enabled", true);
    if (!businesses?.length) return json({ ok: true, ...counts });

    const { data: cfgRows } = await supabase.from("platform_config").select("key, value").like("key", "reminder_cap_%");
    const caps: Record<string, number> = {};
    (cfgRows ?? []).forEach((r: any) => { caps[r.key] = Number(r.value); });
    const monthStart = monthStartSp(now);
    const minStart = new Date(now.getTime() + 30 * 60_000).toISOString();

    let processed = 0;
    for (const biz of businesses) {
      if (processed >= MAX_PER_RUN) break;
      const maxStart = new Date(now.getTime() + (biz.reminder_hours_before || 24) * 3600_000).toISOString();

      const { data: appts } = await supabase
        .from("appointments")
        .select("id, starts_at, client_id, clients(name, phone, whatsapp_opt_out), professionals(name), services(name), appointment_reminders(id, kind)")
        .eq("business_id", biz.id)
        .in("status", ["scheduled", "confirmed"])
        .gte("starts_at", minStart)
        .lte("starts_at", maxStart)
        .order("starts_at")
        .limit(MAX_PER_RUN);

      const pending = (appts ?? []).filter((a: any) => !(a.appointment_reminders ?? []).some((r: any) => r.kind === "before"));
      if (!pending.length) continue;

      // Assinatura do dono
      const { data: owner } = await supabase.from("profiles").select("user_id").eq("business_id", biz.id).eq("role", "owner").limit(1).maybeSingle();
      let plan = "free";
      let accessOk = false;
      if (owner) {
        const { data: sub } = await supabase.from("subscriptions").select("plan_name, acesso_valido_ate").eq("user_id", owner.user_id).order("updated_at", { ascending: false }).limit(1).maybeSingle();
        if (sub) {
          plan = sub.plan_name || "free";
          accessOk = !!sub.acesso_valido_ate && new Date(sub.acesso_valido_ate) >= now;
        }
      }
      const cap = Number.isFinite(caps[`reminder_cap_${plan}`]) ? caps[`reminder_cap_${plan}`] : 30;
      const { count: sentThisMonth } = await supabase
        .from("appointment_reminders").select("id", { count: "exact", head: true })
        .eq("business_id", biz.id).eq("status", "sent").gte("sent_at", monthStart);
      let used = sentThisMonth ?? 0;

      for (const a of pending as any[]) {
        if (processed >= MAX_PER_RUN) break;
        processed++;
        const reminderId = crypto.randomUUID();
        const phone = normalizeBrPhone(a.clients?.phone);
        const base = { id: reminderId, appointment_id: a.id, business_id: biz.id, kind: "before", template_name: TEMPLATE_NAME, to_phone: phone || String(a.clients?.phone || "") };

        let skipReason: string | null = null;
        if (!phone) skipReason = "Cliente sem telefone válido";
        else if (a.clients?.whatsapp_opt_out) skipReason = "Cliente optou por não receber lembretes";
        else if (!accessOk) skipReason = "Assinatura do estabelecimento sem acesso válido";
        else if (used >= cap) skipReason = `Limite mensal atingido (${cap})`;

        if (skipReason) {
          const { error } = await supabase.from("appointment_reminders").insert({ ...base, status: "skipped", error: skipReason });
          if (error && error.code !== "23505") console.error("[LEMBRETES] insert skipped:", error.message);
          counts.skipped++;
          continue;
        }

        // Reserva o registro antes do envio (idempotência via unique)
        const { error: reserveErr } = await supabase.from("appointment_reminders").insert({ ...base, status: "failed", error: "envio em andamento" });
        if (reserveErr) {
          if (reserveErr.code !== "23505") console.error("[LEMBRETES] reserva:", reserveErr.message);
          continue;
        }

        const start = new Date(a.starts_at);
        const firstName = String(a.clients?.name || "cliente").trim().split(/\s+/)[0] || "cliente";
        const params = [firstName, biz.name || "estabelecimento", formatDate(start), formatTime(start), a.professionals?.name || "nossa equipe", a.services?.name || "atendimento"];

        try {
          const res = await fetch(`https://graph.facebook.com/v24.0/${pnid}/messages`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              to: phone,
              type: "template",
              template: {
                name: TEMPLATE_NAME,
                language: { code: "pt_BR" },
                components: [
                  { type: "body", parameters: params.map((t) => ({ type: "text", text: t })) },
                  { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `CONFIRM:${reminderId}` }] },
                  { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: `CANCEL:${reminderId}` }] },
                ],
              },
            }),
          });
          const out = await res.json().catch(() => ({}));
          if (res.ok && out?.messages?.[0]?.id) {
            await supabase.from("appointment_reminders").update({ status: "sent", error: null, provider_message_id: out.messages[0].id, sent_at: new Date().toISOString() }).eq("id", reminderId);
            counts.sent++;
            used++;
          } else {
            const msg = out?.error?.message || `HTTP ${res.status}`;
            await supabase.from("appointment_reminders").update({ status: "failed", error: msg.substring(0, 500) }).eq("id", reminderId);
            counts.failed++;
          }
        } catch (e) {
          await supabase.from("appointment_reminders").update({ status: "failed", error: String((e as Error).message).substring(0, 500) }).eq("id", reminderId);
          counts.failed++;
        }
      }
    }

    console.log("[LEMBRETES] resultado:", JSON.stringify(counts));
    return json({ ok: true, ...counts });
  } catch (e) {
    console.error("enviar-lembretes error:", e);
    return json({ error: (e as Error).message, ...counts }, 500);
  }
});
