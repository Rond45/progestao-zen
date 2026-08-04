import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderPromptTemplate(
  tpl: string,
  vars: Record<string, string>,
): string {
  return tpl.replace(/\{([a-zA-Z_]+)\}/g, (_, k) => vars[k] ?? "");
}

// ===== Fuso de Rondônia: UTC-4 fixo (sem horário de verão) =====
const RO_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY_KEYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

/** Data/hora local de Rondônia representada como campos UTC (para leitura fácil). */
function toLocalRO(d: Date): Date {
  return new Date(d.getTime() - RO_OFFSET_MS);
}

/** Constrói um instante UTC a partir de data (YYYY-MM-DD) e hora (HH:MM) locais RO. */
function fromLocalRO(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00-04:00`);
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localDateStr(d: Date): string {
  const l = toLocalRO(d);
  return `${l.getUTCFullYear()}-${pad2(l.getUTCMonth() + 1)}-${pad2(l.getUTCDate())}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
}

function minutesToTime(min: number): string {
  return `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`;
}

/**
 * Calcula horários livres dos próximos 7 dias considerando jornada (working_hours),
 * agendamentos existentes e quantidade de profissionais ativos.
 */
function buildAvailabilityText(
  workingHours: any,
  appointments: any[],
  professionalsCount: number,
  serviceDurationMinutes = 30,
): string {
  const pros = Math.max(1, professionalsCount);
  const now = new Date();
  const lines: string[] = [];

  for (let i = 0; i < 7; i++) {
    const dayRef = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = localDateStr(dayRef);
    const local = toLocalRO(dayRef);
    const dayKey = DAY_KEYS[local.getUTCDay()];
    const label =
      i === 0 ? "Hoje" : i === 1 ? "Amanhã" : `${pad2(local.getUTCDate())}/${pad2(local.getUTCMonth() + 1)}`;
    const prettyDate = `${pad2(local.getUTCDate())}/${pad2(local.getUTCMonth() + 1)}`;
    const cfg = workingHours?.[dayKey];

    if (!cfg || cfg.enabled !== true || !cfg.open || !cfg.close) {
      lines.push(`${label} (${prettyDate}): Fechado`);
      continue;
    }

    const openMin = timeToMinutes(cfg.open);
    const closeMin = timeToMinutes(cfg.close);
    const free: string[] = [];

    for (let m = openMin; m + serviceDurationMinutes <= closeMin; m += 30) {
      const slotStart = fromLocalRO(dateStr, minutesToTime(m));
      const slotEnd = new Date(slotStart.getTime() + serviceDurationMinutes * 60000);

      // Já passou (para hoje)
      if (slotStart.getTime() <= now.getTime()) continue;

      const overlapping = appointments.filter((a: any) => {
        const s = new Date(a.starts_at).getTime();
        const e = new Date(a.ends_at).getTime();
        return s < slotEnd.getTime() && e > slotStart.getTime();
      });

      // Só indisponível se TODOS os profissionais estiverem ocupados
      const busyPros = new Set(overlapping.map((a: any) => a.professional_id));
      if (busyPros.size >= pros) continue;

      free.push(minutesToTime(m));
    }

    lines.push(
      `${label} (${prettyDate}): ${free.length ? free.join(", ") : "Sem horários livres"}`,
    );
  }

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();

    // Extract data from Evolution API webhook
    const event = body.event || body.type;
    const instanceName = body.instance || body.instanceName || body.data?.instance;

    // Handle connection status updates
    if (event === "connection.update" || event === "status.instance") {
      const state = body.data?.state || body.data?.status;
      if (state === "open" || state === "connected") {
        await supabase
          .from("whatsapp_connections")
          .update({ status: "connected", connected_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("instance_name", instanceName);
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process incoming messages
    if (event !== "messages.upsert" && event !== "message") {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageData = body.data || body;
    const remotePhone = messageData.key?.remoteJid?.replace("@s.whatsapp.net", "") ||
      messageData.from?.replace("@s.whatsapp.net", "");
    const messageText = messageData.message?.conversation ||
      messageData.message?.extendedTextMessage?.text ||
      messageData.body || "";

    // Detect non-text media type when there is no text
    const msgObj = messageData.message || {};
    let mediaType: string | null = null;
    if (!messageText) {
      if (msgObj.audioMessage || msgObj.pttMessage) mediaType = "audio";
      else if (msgObj.imageMessage) mediaType = "imagem";
      else if (msgObj.videoMessage) mediaType = "video";
      else if (msgObj.stickerMessage) mediaType = "figurinha";
      else if (msgObj.documentMessage) mediaType = "documento";
      else if (msgObj.locationMessage) mediaType = "localizacao";
      else if (msgObj.contactMessage || msgObj.contactsArrayMessage) mediaType = "contato";
    }
    if (mediaType) console.log("[MEDIA] Mensagem não-textual recebida:", mediaType, remotePhone);

    if (!remotePhone || messageData.key?.fromMe || (!messageText && !mediaType)) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get connection config
    const { data: conn } = await supabase
      .from("whatsapp_connections")
      .select("*")
      .eq("instance_name", instanceName)
      .single();

    if (!conn) {
      console.error("No connection found for instance:", instanceName);
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const businessId = conn.business_id;

    // Fetch business context
    const [
      { data: business },
      { data: services },
      { data: professionals },
      { data: appointments },
      { data: platformCfgRows },
    ] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).single(),
      supabase.from("services").select("*").eq("business_id", businessId).eq("active", true),
      supabase.from("professionals").select("*").eq("business_id", businessId).eq("active", true),
      supabase.from("appointments").select("*, services(name), professionals(name), clients(name)")
        .eq("business_id", businessId)
        .gte("starts_at", new Date().toISOString())
        .lte("starts_at", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .neq("status", "cancelled")
        .order("starts_at"),
      supabase.from("platform_config").select("key, value"),
    ]);

    const platformCfg: Record<string, string> = {};
    (platformCfgRows ?? []).forEach((r: any) => { platformCfg[r.key] = r.value; });

    // Find or create client by phone
    let { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("business_id", businessId)
      .eq("phone", remotePhone)
      .maybeSingle();

    let isFirstContact = false;
    if (!client) {
      isFirstContact = true;
      const { data: newClient } = await supabase
        .from("clients")
        .insert({ business_id: businessId, name: "", phone: remotePhone })
        .select()
        .single();
      client = newClient;
    }

    // Determine if the client already has a real name (not empty, not the legacy placeholder)
    const hasRealName =
      !!client?.name &&
      client.name.trim() !== "" &&
      !/^WhatsApp\s/i.test(client.name);

    // Fetch this client's appointment history (past & future) for context
    const { data: clientHistory } = await supabase
      .from("appointments")
      .select("starts_at, status, services(name), professionals(name)")
      .eq("business_id", businessId)
      .eq("client_id", client!.id)
      .order("starts_at", { ascending: false })
      .limit(10);

    const historyCount = clientHistory?.length ?? 0;

    // Fetch this client's ACTIVE FUTURE appointments (used for cancellation)
    const { data: futureApts } = await supabase
      .from("appointments")
      .select("id, starts_at, status, services(name), professionals(name)")
      .eq("business_id", businessId)
      .eq("client_id", client!.id)
      .neq("status", "cancelled")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    // Só é recorrente se tivermos um nome real; sem nome => tratar como primeiro contato
    const isReturning = hasRealName === true && (historyCount > 0 || !isFirstContact);

    // Get or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .eq("client_id", client!.id)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({ business_id: businessId, client_id: client!.id, status: "open" })
        .select()
        .single();
      conversation = newConv;
    }

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("direction, body")
      .eq("conversation_id", conversation!.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Save incoming message
    await supabase.from("messages").insert({
      business_id: businessId,
      conversation_id: conversation!.id,
      direction: "inbound",
      body: messageText || `[${mediaType}]`,
      from_phone: remotePhone,
    });

    // Handle non-text media: reply politely asking for text, without calling OpenAI
    if (!messageText && mediaType) {
      const mediaReplies: Record<string, string> = {
        audio: "Oi! No momento eu ainda não consigo ouvir áudios 🙈 Pode me escrever por mensagem, por favor? Assim consigo te ajudar rapidinho!",
        imagem: "Recebi sua imagem, mas ainda não consigo visualizar fotos por aqui. Pode me contar por escrito o que você precisa? 😊",
        video: "Recebi seu vídeo, mas ainda não consigo assistir por aqui. Pode me escrever o que precisa, por favor?",
        figurinha: "Hehe 😄 Pode me escrever o que você precisa? Assim te ajudo melhor!",
        documento: "Recebi seu documento, mas ainda não consigo abrir arquivos por aqui. Pode me dizer por escrito o que precisa?",
        localizacao: "Recebi sua localização! Se precisar de ajuda com agendamento ou informações, é só me escrever 😊",
        contato: "Pode me escrever o que você precisa, por favor? Assim consigo te ajudar melhor 😊",
      };
      const mediaReply = mediaReplies[mediaType] ||
        "Pode me escrever o que você precisa, por favor? Assim consigo te ajudar melhor 😊";

      await supabase.from("messages").insert({
        business_id: businessId,
        conversation_id: conversation!.id,
        direction: "outbound",
        body: mediaReply,
        to_phone: remotePhone,
      });

      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString(), status: "open" })
        .eq("id", conversation!.id);

      const mediaEvoUrl = Deno.env.get("EVOLUTION_API_URL")?.replace(/\/$/, "");
      const mediaEvoKey = Deno.env.get("EVOLUTION_API_KEY");
      if (mediaEvoUrl && mediaEvoKey) {
        await fetch(`${mediaEvoUrl}/message/sendText/${(conn as any).instance_name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: mediaEvoKey },
          body: JSON.stringify({ number: remotePhone, text: mediaReply }),
        });
      }

      return new Response(JSON.stringify({ ok: true, mediaType }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to auto-detect a name in this message if we still don't have one
    if (!hasRealName) {
      const nameMatch = messageText.match(
        /(?:meu\s+nome\s+(?:e|é|eh)|me\s+chamo|sou\s+o|sou\s+a|aqui\s+e|aqui\s+é)\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]{1,40})/i,
      );
      if (nameMatch) {
        const detected = nameMatch[1].trim().split(/\s+/).slice(0, 3).join(" ");
        if (detected.length >= 2) {
          await supabase.from("clients").update({ name: detected }).eq("id", client!.id);
          client!.name = detected;
        }
      }
    }

    // Build system prompt
    const servicesText = services?.map((s: any) => `- ${s.name}: R$ ${(s.price_cents / 100).toFixed(2)} (${s.duration_minutes}min)`).join("\n") || "Nenhum serviço cadastrado";
    const prosText = professionals?.map((p: any) => `- ${p.name} (${p.specialty || "Geral"})`).join("\n") || "Nenhum profissional cadastrado";
    const aptsText = appointments?.map((a: any) => {
      const dt = new Date(a.starts_at);
      return `- ${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${a.services?.name} com ${a.professionals?.name} (${a.clients?.name})`;
    }).join("\n") || "Nenhum agendamento";

    const historyText = (clientHistory ?? [])
      .map((h: any) => {
        const dt = new Date(h.starts_at);
        return `- ${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${h.services?.name ?? "-"} com ${h.professionals?.name ?? "-"} (${h.status})`;
      })
      .join("\n") || "Sem histórico anterior.";

    // Format a timestamp in Rondônia local time (UTC-4)
    const fmtRO = (iso: string) => {
      const d = new Date(iso);
      const dateStr = d.toLocaleDateString("pt-BR", { timeZone: "America/Porto_Velho" });
      const timeStr = d.toLocaleTimeString("pt-BR", {
        timeZone: "America/Porto_Velho",
        hour: "2-digit",
        minute: "2-digit",
      });
      const isoDate = new Date(d.getTime() - 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return { dateStr, timeStr, isoDate };
    };

    const futureAptsText = (futureApts ?? []).length
      ? (futureApts ?? [])
          .map((a: any) => {
            const f = fmtRO(a.starts_at);
            return `- ${f.dateStr} (${f.isoDate}) às ${f.timeStr} — ${a.services?.name ?? "-"} com ${a.professionals?.name ?? "-"}`;
          })
          .join("\n")
      : "Nenhum agendamento futuro";

    const aiName = (conn as any).ai_name || platformCfg.default_ai_name || "Atendente";
    const workingHours =
      (conn as any).working_hours ||
      `${business?.opening_time || "09:00"} às ${business?.closing_time || "19:00"}`;
    const servicesInfo = (conn as any).services_info || servicesText;

    const minDuration = Math.min(
      ...((services ?? []).map((s: any) => s.duration_minutes).filter((n: any) => n > 0)),
      30,
    );
    const availabilityText = buildAvailabilityText(
      business?.working_hours,
      appointments ?? [],
      professionals?.length ?? 1,
      Number.isFinite(minDuration) && minDuration > 0 ? minDuration : 30,
    );

    // Global default prompt from platform_config (template with variables)
    const globalTemplate =
      platformCfg.default_system_prompt ||
      "Você é {ai_name}, atendente virtual do {nome_estabelecimento}. Responda em português brasileiro, de forma cordial e objetiva.";

    const baseGlobal = renderPromptTemplate(globalTemplate, {
      ai_name: aiName,
      nome_estabelecimento: business?.name || "Estabelecimento",
      working_hours: workingHours,
      services_info: servicesInfo,
    });

    const perBusinessTone = (conn as any).system_prompt || "";

    const clientBlock = `DADOS DO CLIENTE:
Nome: ${hasRealName ? client!.name : "(desconhecido — pergunte de forma educada)"}
Situação: ${isReturning ? "CLIENTE RECORRENTE" : "PRIMEIRO CONTATO"}
Total de agendamentos anteriores: ${historyCount}

HISTÓRICO DE AGENDAMENTOS DESTE CLIENTE:
${historyText}`;

    const behaviorRules = isReturning
      ? `- Cumprimente o cliente pelo nome (${hasRealName ? client!.name : "quando descobrir"}).
- Não peça o nome novamente se já souber.
- Sugira retomar um serviço frequente do histórico quando fizer sentido.`
      : `- É o PRIMEIRO CONTATO deste número. Apresente-se: "Olá! Eu sou ${aiName}, atendente virtual da ${business?.name || "loja"}."
- Pergunte de forma educada o nome do cliente antes de seguir.
- Assim que o cliente informar o nome, use-o na conversa. O sistema atualiza o cadastro automaticamente.`;

    const systemPrompt = `${baseGlobal}
${perBusinessTone ? `\nESTILO DO ESTABELECIMENTO:\n${perBusinessTone}\n` : ""}

DADOS DO ESTABELECIMENTO:
Nome: ${business?.name || "Estabelecimento"}
Telefone: ${business?.phone || "Não informado"}
Endereço: ${business?.address || "Não informado"}
Horário: ${workingHours}

SERVIÇOS E PREÇOS:
${servicesInfo}

PROFISSIONAIS DISPONÍVEIS:
${prosText}

HORÁRIOS DISPONÍVEIS (próximos 7 dias) — horário local de Rondônia (UTC-4):
${availabilityText}

AGENDA DOS PRÓXIMOS 7 DIAS (horários já ocupados):
${aptsText}

${clientBlock}

SEUS AGENDAMENTOS FUTUROS (deste cliente, ativos):
${futureAptsText}

INSTRUÇÕES DE COMPORTAMENTO PARA ESTE CLIENTE:
${behaviorRules}

INSTRUÇÕES IMPORTANTES:
- Use SOMENTE os horários da lista de HORÁRIOS DISPONÍVEIS acima ao oferecer opções ao cliente. NUNCA invente horários que não estejam nessa lista. Se o cliente pedir um horário específico, verifique se ele está na lista: se estiver, confirme; se não, diga que não há vaga naquele horário e ofereça os mais próximos disponíveis da lista.
- Ao invés de fazer perguntas abertas, ofereça 2 ou 3 opções concretas quando possível (ex: horários disponíveis reais com base na agenda acima).
- Se o cliente quiser agendar, colete: serviço desejado, profissional preferido, data e horário.
- Confirme todos os dados antes de finalizar.
- Se o cliente quiser cancelar ou desmarcar, use a função cancelar_agendamento com a data e horário do agendamento futuro dele (veja SEUS AGENDAMENTOS FUTUROS acima). NUNCA ofereça horários para marcar quando o cliente pede para cancelar.
- REGRA CRÍTICA DE AGENDAMENTO: Sempre que você confirmar um horário com o cliente (quando ele aceitar dia, horário e serviço), você é OBRIGADA a incluir na MESMA mensagem, em uma linha separada ao final, o comando técnico EXATO:
[AGENDAR] nome_do_serviço | nome_do_profissional | data_YYYY-MM-DD | horário_HH:MM
Esse comando é invisível para o cliente (o sistema o remove antes de enviar). Se você confirmar um agendamento SEM emitir esse comando, o horário NÃO será registrado e o cliente ficará sem atendimento. Portanto, NUNCA confirme um agendamento sem incluir a linha [AGENDAR] com os dados reais. Use os nomes EXATOS dos serviços e profissionais listados acima. Exemplo de confirmação correta:
"Perfeito! Confirmado então 😊
[AGENDAR] Corte Masculino | Rafael Mendes | 2026-08-05 | 15:00"
- Hoje é ${new Date().toLocaleDateString("pt-BR")}.`;

    // Build messages for OpenAI
    const chatHistory = (recentMessages || []).reverse().map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.body,
    }));
    chatHistory.push({ role: "user", content: messageText });

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
        temperature: 0.7,
        max_tokens: 500,
        tool_choice: "auto",
        tools: [
          {
            type: "function",
            function: {
              name: "criar_agendamento",
              description:
                "Registra um agendamento confirmado na agenda do estabelecimento. Use SEMPRE que o cliente confirmar dia, horário, serviço (e profissional, se houver mais de um). Não confirme um agendamento ao cliente sem chamar esta função.",
              parameters: {
                type: "object",
                properties: {
                  servico: { type: "string", description: "Nome do serviço desejado" },
                  profissional: { type: "string", description: "Nome do profissional" },
                  data: { type: "string", description: "Data no formato YYYY-MM-DD" },
                  horario: { type: "string", description: "Horário no formato HH:MM" },
                },
                required: ["servico", "profissional", "data", "horario"],
                additionalProperties: false,
              },
            },
          },
          {
            type: "function",
            function: {
              name: "salvar_nome_cliente",
              description:
                "Salva o nome do cliente assim que ele se identificar ou informar como se chama, de qualquer forma que seja. Use sempre que descobrir o nome do cliente na conversa.",
              parameters: {
                type: "object",
                properties: {
                  nome: { type: "string", description: "Primeiro nome (e sobrenome se houver) do cliente" },
                },
                required: ["nome"],
                additionalProperties: false,
              },
            },
          },
        ],
      }),
    });

    const openaiData = await openaiRes.json();
    const aiMessage = openaiData.choices?.[0]?.message;
    let reply = aiMessage?.content || "";

    // Helper: create appointment from resolved service/professional
    const friendlyAptError = (msg: string) => {
      if (/Conflito/i.test(msg)) {
        return "Ops, esse horário acabou de ser preenchido! Posso te oferecer outro horário próximo?";
      }
      if (/jornada/i.test(msg)) {
        return `Esse horário está fora do nosso expediente. Nosso atendimento é ${workingHours}. Quer escolher outro horário?`;
      }
      return "Tive um probleminha ao registrar. Pode confirmar o horário novamente, por favor?";
    };

    const createAppointment = async (service: any, pro: any, date: string, time: string) => {
      // Rondônia: offset fixo -04:00 (sem horário de verão)
      const startsAt = new Date(`${date}T${time}:00-04:00`);
      const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);
      const { error } = await supabase.from("appointments").insert({
        business_id: businessId,
        client_id: client!.id,
        professional_id: pro.id,
        service_id: service.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "confirmed",
        notes: "Agendado via WhatsApp IA",
      });
      return error;
    };

    // 1) Preferred path: OpenAI function calling — process ALL tool calls
    const toolCalls = (aiMessage?.tool_calls ?? []) as any[];
    const nameCall = toolCalls.find((t: any) => t.function?.name === "salvar_nome_cliente");
    const toolCall = toolCalls.find((t: any) => t.function?.name === "criar_agendamento");

    if (nameCall) {
      try {
        const nameArgs = JSON.parse(nameCall.function?.arguments || "{}");
        const cleaned = String(nameArgs.nome ?? "")
          .trim()
          .split(/\s+/)
          .slice(0, 3)
          .join(" ");
        if (cleaned.length >= 2) {
          await supabase.from("clients").update({ name: cleaned }).eq("id", client!.id);
          client!.name = cleaned;
        }
      } catch (err) {
        console.error("[NAME_TOOL_PARSE_ERROR]", nameCall.function?.arguments, err);
      }
    }

    let handledByTool = false;
    if (toolCall) {
      handledByTool = true;
      let args: any = {};
      try {
        args = JSON.parse(toolCall.function?.arguments || "{}");
      } catch (err) {
        console.error("[TOOL_ARGS_PARSE_ERROR]", toolCall.function?.arguments, err);
      }

      const serviceName = String(args.servico ?? "").trim();
      const proName = String(args.profissional ?? "").trim();
      const date = String(args.data ?? "").trim();
      const time = String(args.horario ?? "").trim().padStart(5, "0");

      const service = services?.find((s: any) =>
        s.name.toLowerCase().includes(serviceName.toLowerCase()) ||
        serviceName.toLowerCase().includes(s.name.toLowerCase())
      );
      const pro = professionals?.find((p: any) =>
        p.name.toLowerCase().includes(proName.toLowerCase()) ||
        proName.toLowerCase().includes(p.name.toLowerCase())
      ) || (professionals?.length === 1 ? professionals[0] : undefined);

      if (!service || !pro || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
        console.log("[TOOL_MATCH_FAILED]", { serviceName, proName, date, time });
        reply =
          "Só preciso confirmar alguns detalhes antes de registrar: pode me dizer novamente o serviço, o profissional, a data e o horário desejados?";
      } else {
        const aptError = await createAppointment(service, pro, date, time);
        if (aptError) {
          console.error("Appointment error (tool):", aptError);
          reply = friendlyAptError(aptError.message || "");
        } else {
          reply = `✅ Agendamento confirmado!\n📋 ${service.name} com ${pro.name}\n📅 ${new Date(`${date}T${time}:00-04:00`).toLocaleDateString("pt-BR", { timeZone: "America/Porto_Velho" })} às ${time}\n\nTe esperamos! 😊`;
        }
      }
    }

    if (!reply) {
      reply = "Desculpe, não consegui processar sua mensagem. Tente novamente.";
    }

    // Check if AI wants to create an appointment
    const appointmentMatch = handledByTool
      ? null
      : reply.match(/\[AGENDAR\]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{1,2}:\d{2})/);
    if (!appointmentMatch) {
      const confirmationHints = /(confirmad|agendad|marcad|reservad|te espero|te esperamos|anotado|fechado)/i;
      if (!handledByTool && confirmationHints.test(reply)) {
        console.log(
          "[AGENDAR_MISSING] IA parece ter confirmado agendamento sem emitir o comando técnico. Reply completo:",
          reply,
        );
      }
    }
    if (appointmentMatch) {
      const [, serviceName, proName, date, rawTime] = appointmentMatch;
      const time = rawTime.padStart(5, "0");

      const service = services?.find((s: any) => s.name.toLowerCase().includes(serviceName.trim().toLowerCase()));
      const pro = professionals?.find((p: any) => p.name.toLowerCase().includes(proName.trim().toLowerCase()));

      if (service && pro) {
        const aptError = await createAppointment(service, pro, date, time);
        if (aptError) {
          console.error("Appointment error:", aptError);
          reply = reply.replace(/\[AGENDAR\].*/, "").trim() + "\n\n" + friendlyAptError(aptError.message || "");
        } else {
          reply = reply.replace(/\[AGENDAR\].*/, "") + `\n\n✅ Agendamento confirmado!\n📋 ${service.name} com ${pro.name}\n📅 ${new Date(`${date}T${time}:00-04:00`).toLocaleDateString("pt-BR", { timeZone: "America/Porto_Velho" })} às ${time}\n\nTe esperamos! 😊`;
        }
      }
    }

    // Clean any remaining tags
    reply = reply.replace(/\[AGENDAR\].*$/gm, "").trim();

    // Save outbound message
    await supabase.from("messages").insert({
      business_id: businessId,
      conversation_id: conversation!.id,
      direction: "outbound",
      body: reply,
      to_phone: remotePhone,
    });

    // Update conversation
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString(), status: "open" })
      .eq("id", conversation!.id);

    // Send reply via Evolution API
    const evolutionUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionKey = Deno.env.get("EVOLUTION_API_KEY");
    const baseUrl = evolutionUrl?.replace(/\/$/, "");
    if (baseUrl && evolutionKey) {
      await fetch(`${baseUrl}/message/sendText/${(conn as any).instance_name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: evolutionKey,
        },
        body: JSON.stringify({
          number: remotePhone,
          text: reply,
        }),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
