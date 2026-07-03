import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, Bot, FileText, Settings, QrCode, Loader2 } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const WhatsAppIA = () => {
  const { businessId } = useBusiness();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [qrModal, setQrModal] = useState<{ open: boolean; qr: string; loading: boolean }>({
    open: false,
    qr: "",
    loading: false,
  });

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

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("whatsapp-connect", {
        body: { business_id: businessId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { qr_code?: string | null; message?: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["whatsapp-connection", businessId] });
      if (data?.qr_code) {
        setQrModal({ open: true, qr: data.qr_code, loading: false });
      } else {
        toast({ title: data?.message || "Instância criada. Tente novamente em instantes." });
      }
    },
    onError: (e: any) =>
      toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" }),
  });

  const handleConnect = () => {
    if (!businessId) return;
    setQrModal({ open: true, qr: "", loading: true });
    connectMutation.mutate(undefined, {
      onSettled: () => setQrModal((p) => ({ ...p, loading: false })),
    });
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
          Configurar
        </Button>
      </div>

      {/* Connection status */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isConnected ? "bg-primary/10" : "bg-secondary"}`}>
              {isConnected ? <Wifi className="h-5 w-5 text-primary" /> : <WifiOff className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isConnected ? "WhatsApp conectado" : "WhatsApp desconectado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isConnected
                  ? connection?.phone_number || "Número configurado"
                  : "Clique em Conectar WhatsApp para gerar o QR Code"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isConnected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-primary" : "bg-muted-foreground"}`} />
              {isConnected ? "Online" : "Offline"}
            </span>
            {!isConnected && (
              <Button size="sm" onClick={handleConnect} disabled={connectMutation.isPending}>
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Conectar WhatsApp
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversations */}
        <div className="rounded-lg border border-border bg-card p-5">
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

        {/* Recent messages */}
        <div className="rounded-lg border border-border bg-card p-5">
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

      <Dialog open={qrModal.open} onOpenChange={(o) => !o && setQrModal({ open: false, qr: "", loading: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrModal.loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : qrModal.qr ? (
              <>
                <img
                  src={qrModal.qr.startsWith("data:") ? qrModal.qr : `data:image/png;base64,${qrModal.qr}`}
                  alt="QR Code"
                  className="w-64 h-64 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                  Abra o WhatsApp no seu celular, vá em <strong>Aparelhos conectados</strong> e escaneie este QR Code.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Não foi possível gerar o QR Code. Tente novamente em instantes.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppIA;
