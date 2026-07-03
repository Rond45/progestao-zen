import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wifi, WifiOff, Bot, FileText, Settings, QrCode, Loader2, KeyRound, Smartphone } from "lucide-react";
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
  const [connectModal, setConnectModal] = useState<{
    open: boolean;
    method: "qr" | "code";
    qr: string;
    pairing: string;
    loading: boolean;
  }>({ open: false, method: "qr", qr: "", pairing: "", loading: false });
  const [phoneInput, setPhoneInput] = useState("");

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
    mutationFn: async (vars: { phone_number?: string }) => {
      const { data, error } = await supabase.functions.invoke("whatsapp-connect", {
        body: { business_id: businessId, phone_number: vars.phone_number },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { qr_code?: string | null; pairing_code?: string | null; message?: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["whatsapp-connection", businessId] });
      setConnectModal((p) => ({
        ...p,
        qr: data?.qr_code || "",
        pairing: data?.pairing_code || "",
        loading: false,
      }));
      if (!data?.qr_code && !data?.pairing_code) {
        toast({ title: data?.message || "Instância criada. Tente novamente em instantes." });
      }
    },
    onError: (e: any) => {
      setConnectModal((p) => ({ ...p, loading: false }));
      toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" });
    },
  });

  const handleConnectQR = () => {
    if (!businessId) return;
    setConnectModal({ open: true, method: "qr", qr: "", pairing: "", loading: true });
    connectMutation.mutate({});
  };

  const handleConnectCode = () => {
    if (!businessId) return;
    const digits = phoneInput.replace(/\D/g, "");
    if (digits.length < 10) {
      toast({ title: "Número inválido", description: "Digite com DDI + DDD (ex: 5569XXXXXXXXX).", variant: "destructive" });
      return;
    }
    setConnectModal({ open: true, method: "code", qr: "", pairing: "", loading: true });
    connectMutation.mutate({ phone_number: digits });
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
              <span className="text-xs text-muted-foreground">Escolha um método abaixo</span>
            )}
          </div>
        </div>
      </div>

      {!isConnected && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-1">Como você quer conectar?</h3>
          <p className="text-xs text-muted-foreground mb-4">
            QR Code é ideal se você usa outro aparelho para escanear. O código de pareamento é ideal para configurar direto pelo próprio celular.
          </p>
          <Tabs defaultValue="qr">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="qr" className="gap-2"><QrCode className="h-4 w-4" />Por QR Code</TabsTrigger>
              <TabsTrigger value="code" className="gap-2"><KeyRound className="h-4 w-4" />Por código</TabsTrigger>
            </TabsList>
            <TabsContent value="qr" className="pt-4">
              <p className="text-sm text-muted-foreground mb-3">Vamos gerar um QR Code para você escanear com o WhatsApp de outro aparelho.</p>
              <Button onClick={handleConnectQR} disabled={connectMutation.isPending}>
                {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                Gerar QR Code
              </Button>
            </TabsContent>
            <TabsContent value="code" className="pt-4 space-y-3">
              <div className="space-y-1.5 max-w-md">
                <Label htmlFor="phone">Número do WhatsApp (DDI + DDD + número)</Label>
                <Input
                  id="phone"
                  placeholder="5569999999999"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  inputMode="numeric"
                />
                <p className="text-xs text-muted-foreground">Ex: 55 (Brasil) + 69 (DDD) + número. Apenas dígitos.</p>
              </div>
              <Button onClick={handleConnectCode} disabled={connectMutation.isPending} className="gap-2">
                {connectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                Conectar por código
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      )}

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

      <Dialog open={connectModal.open} onOpenChange={(o) => !o && setConnectModal({ open: false, method: "qr", qr: "", pairing: "", loading: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {connectModal.method === "qr" ? "Escaneie o QR Code" : "Digite o código no WhatsApp"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {connectModal.loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {connectModal.method === "qr" ? "Gerando QR Code..." : "Gerando código..."}
                </p>
              </div>
            ) : connectModal.method === "qr" && connectModal.qr ? (
              <>
                <img
                  src={connectModal.qr.startsWith("data:") ? connectModal.qr : `data:image/png;base64,${connectModal.qr}`}
                  alt="QR Code"
                  className="w-64 h-64 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                  Abra o WhatsApp no seu celular, vá em <strong>Aparelhos conectados</strong> e escaneie este QR Code.
                </p>
              </>
            ) : connectModal.method === "code" && connectModal.pairing ? (
              <>
                <div className="text-4xl font-mono font-bold tracking-[0.4em] px-6 py-4 rounded-lg bg-secondary text-foreground">
                  {connectModal.pairing}
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[300px]">
                  Abra o WhatsApp no celular &gt; <strong>Aparelhos conectados</strong> &gt; <strong>Conectar com número de telefone</strong> &gt; digite este código.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Não foi possível gerar. Tente novamente em instantes.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppIA;
