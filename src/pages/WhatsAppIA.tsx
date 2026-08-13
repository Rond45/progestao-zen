import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, FileText, Settings, Loader2, MessageCircle, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: any;
  }
}

const FB_CONFIG_ID = "1737385587504123";

const WhatsAppIA = () => {
  const { businessId } = useBusiness();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const sessionInfo = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  const { data: connection } = useQuery({
    queryKey: ["whatsapp-connection", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("business_id", businessId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, clients(name)")
        .eq("business_id", businessId!)
        .order("last_message_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*, conversations(clients(name))")
        .eq("business_id", businessId!)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const isConnected = connection?.status === "connected";

  // Captura waba_id / phone_number_id enviados pelo Embedded Signup via postMessage
  useEffect(() => {
    function sessionInfoListener(event: MessageEvent) {
      if (event.origin !== "https://www.facebook.com" && event.origin !== "https://web.facebook.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.event === "FINISH") {
          sessionInfo.current = {
            phone_number_id: data.data?.phone_number_id,
            waba_id: data.data?.waba_id,
          };
        }
      } catch {
        /* payload não-JSON: ignorar */
      }
    }
    window.addEventListener("message", sessionInfoListener);
    return () => window.removeEventListener("message", sessionInfoListener);
  }, []);

  const finishSignup = async (code: string) => {
    const { phone_number_id, waba_id } = sessionInfo.current;
    if (!phone_number_id || !waba_id) {
      setConnecting(false);
      toast({
        title: "Conexão incompleta",
        description: "Não recebemos os dados do número. Tente novamente e conclua todas as etapas da Meta.",
        variant: "destructive",
      });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-embedded-signup", {
        body: { business_id: businessId, code, waba_id, phone_number_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "WhatsApp conectado com sucesso!" });
      sessionInfo.current = {};
      qc.invalidateQueries({ queryKey: ["whatsapp-connection", businessId] });
    } catch (e: any) {
      toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const launchWhatsAppSignup = () => {
    if (!businessId) return;
    if (!window.FB) {
      toast({
        title: "Aguarde um instante",
        description: "O login da Meta ainda está carregando. Tente novamente em alguns segundos.",
        variant: "destructive",
      });
      return;
    }
    setConnecting(true);
    sessionInfo.current = {};
    window.FB.login(
      (response: any) => {
        const code = response?.authResponse?.code;
        if (code) {
          finishSignup(code);
        } else {
          setConnecting(false);
          toast({ title: "Conexão cancelada", description: "O login da Meta não foi concluído." });
        }
      },
      {
        config_id: FB_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        extras: { setup: {} },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp IA</h1>
          <p className="text-sm text-muted-foreground mt-1">Automação de atendimento via WhatsApp</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/configuracoes")}>
          <Settings className="h-4 w-4" />
          Configurar IA e horários
        </Button>
      </div>

      {/* Status da conexão */}
      {isConnected ? (
        <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">WhatsApp conectado</p>
                <p className="text-xs text-muted-foreground">
                  {connection?.phone_number || "Número oficial ativo"}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Online
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">WhatsApp desconectado</p>
              <p className="text-xs text-muted-foreground">Nenhum número vinculado a este negócio</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Conecte o WhatsApp do seu negócio para ativar o atendimento automático com IA. A conexão é feita pelo login
            oficial da Meta, sem QR Code — leva menos de 2 minutos.
          </p>
          <Button className="mt-4 gap-2" size="lg" onClick={launchWhatsAppSignup} disabled={connecting}>
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            {connecting ? "Conectando..." : "Conectar meu WhatsApp"}
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            Conexão oficial WhatsApp Business (Meta). Seus dados de login não passam por nós.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversas */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Conversas</h3>
          </div>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma conversa registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {conversations.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.clients?.name || "Cliente desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.last_message_at ? format(new Date(c.last_message_at), "dd/MM HH:mm") : "Sem mensagens"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    c.status === "open" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {c.status === "open" ? "Aberta" : "Fechada"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mensagens recentes */}
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Mensagens recentes</h3>
          </div>
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma mensagem registrada ainda.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex gap-3 ${msg.direction === "outbound" ? "flex-row-reverse" : ""}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    msg.direction === "outbound" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground"
                  }`}>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {msg.direction === "outbound" ? "IA" : msg.conversations?.clients?.name || "Cliente"}
                    </p>
                    <p className="text-sm">{msg.body}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(msg.created_at), "HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppIA;
