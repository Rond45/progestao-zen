import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    if (!remotePhone || !messageText || messageData.key?.fromMe) {
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
    ]);

    // Find or create client by phone
    let { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("business_id", businessId)
      .eq("phone", remotePhone)
      .maybeSingle();

    if (!client) {
      const { data: newClient } = await supabase
        .from("clients")
        .insert({ business_id: businessId, name: `WhatsApp ${remotePhone}`, phone: remotePhone })
        .select()
        .single();
      client = newClient;
    }

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
      body: messageText,
      from_phone: remotePhone,
    });

    // Build system prompt
    const servicesText = services?.map((s: any) => `- ${s.name}: R$ ${(s.price_cents / 100).toFixed(2)} (${s.duration_minutes}min)`).join("\n") || "Nenhum serviço cadastrado";
    const prosText = professionals?.map((p: any) => `- ${p.name} (${p.specialty || "Geral"})`).join("\n") || "Nenhum profissional cadastrado";
    const aptsText = appointments?.map((a: any) => {
      const dt = new Date(a.starts_at);
      return `- ${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} - ${a.services?.name} com ${a.professionals?.name} (${a.clients?.name})`;
    }).join("\n") || "Nenhum agendamento";

    const systemPrompt = `${(conn as any).system_prompt || "Você é um atendente virtual simpático e profissional."}

DADOS DO ESTABELECIMENTO:
Nome: ${business?.name || "Estabelecimento"}
Telefone: ${business?.phone || "Não informado"}
Endereço: ${business?.address || "Não informado"}
Horário: ${(conn as any).working_hours || `${business?.opening_time || "09:00"} às ${business?.closing_time || "19:00"}`}

SERVIÇOS E PREÇOS:
${(conn as any).services_info || servicesText}

PROFISSIONAIS DISPONÍVEIS:
${prosText}

AGENDA DOS PRÓXIMOS 7 DIAS (horários já ocupados):
${aptsText}

INSTRUÇÕES IMPORTANTES:
- Se o cliente quiser agendar, pergunte: serviço desejado, profissional preferido, data e horário.
- Confirme todos os dados antes de finalizar.
- Para confirmar agendamento, responda EXATAMENTE com: [AGENDAR] serviço | profissional | data (YYYY-MM-DD) | horário (HH:MM)
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
        Authorization: `Bearer ${(conn as any).openai_api_key}`,
      },
      body: JSON.stringify({
        model: (conn as any).openai_model || "gpt-4o-mini",
        messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const openaiData = await openaiRes.json();
    let reply = openaiData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua mensagem. Tente novamente.";

    // Check if AI wants to create an appointment
    const appointmentMatch = reply.match(/\[AGENDAR\]\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d{2}:\d{2})/);
    if (appointmentMatch) {
      const [, serviceName, proName, date, time] = appointmentMatch;

      const service = services?.find((s: any) => s.name.toLowerCase().includes(serviceName.trim().toLowerCase()));
      const pro = professionals?.find((p: any) => p.name.toLowerCase().includes(proName.trim().toLowerCase()));

      if (service && pro) {
        const startsAt = new Date(`${date}T${time}:00`);
        const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60000);

        const { error: aptError } = await supabase.from("appointments").insert({
          business_id: businessId,
          client_id: client!.id,
          professional_id: pro.id,
          service_id: service.id,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "confirmed",
          notes: "Agendado via WhatsApp IA",
        });

        if (aptError) {
          console.error("Appointment error:", aptError);
          reply = reply.replace(/\[AGENDAR\].*/, "") + "\n\nHouve um erro ao criar o agendamento. Por favor, tente novamente ou entre em contato diretamente.";
        } else {
          reply = reply.replace(/\[AGENDAR\].*/, "") + `\n\n✅ Agendamento confirmado!\n📋 ${service.name} com ${pro.name}\n📅 ${new Date(date).toLocaleDateString("pt-BR")} às ${time}\n\nTe esperamos! 😊`;
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
    const baseUrl = (conn as any).evolution_api_url?.replace(/\/$/, "");
    if (baseUrl) {
      await fetch(`${baseUrl}/message/sendText/${(conn as any).instance_name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: (conn as any).evolution_api_key,
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
