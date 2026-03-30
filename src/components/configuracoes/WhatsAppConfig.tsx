import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Wifi, WifiOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_PROMPT = `Você é um atendente virtual simpático e profissional. Responda sempre em português brasileiro, seja cordial e objetivo. Você pode verificar horários disponíveis, fazer agendamentos e informar sobre serviços e preços. Nunca invente informações que não foram fornecidas.`;

interface Props {
  businessId: string | null;
}

const WhatsAppConfig = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing connection
  const { data: connection, isLoading } = useQuery({
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

  // Section A - AI Data
  const [aiForm, setAiForm] = useState({
    working_hours: "",
    services_info: "",
    system_prompt: DEFAULT_PROMPT,
  });

  // Section B - Connection
  const [connForm, setConnForm] = useState({
    evolution_api_url: "",
    evolution_api_key: "",
    instance_name: "",
    openai_api_key: "",
    openai_model: "gpt-4o-mini",
  });

  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (connection) {
      setAiForm({
        working_hours: (connection as any).working_hours || "",
        services_info: (connection as any).services_info || "",
        system_prompt: (connection as any).system_prompt || DEFAULT_PROMPT,
      });
      setConnForm({
        evolution_api_url: (connection as any).evolution_api_url || "",
        evolution_api_key: (connection as any).evolution_api_key || "",
        instance_name: (connection as any).instance_name || "",
        openai_api_key: (connection as any).openai_api_key || "",
        openai_model: (connection as any).openai_model || "gpt-4o-mini",
      });
      if ((connection as any).qr_code) {
        setQrCode((connection as any).qr_code);
      }
    }
  }, [connection]);

  // Save AI data
  const saveAiData = useMutation({
    mutationFn: async () => {
      const payload = {
        working_hours: aiForm.working_hours,
        services_info: aiForm.services_info,
        system_prompt: aiForm.system_prompt,
        updated_at: new Date().toISOString(),
      };
      if (connection) {
        const { error } = await supabase
          .from("whatsapp_connections")
          .update(payload as any)
          .eq("business_id", businessId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_connections")
          .insert({ ...payload, business_id: businessId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] });
      toast({ title: "Dados da IA salvos com sucesso!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Connect WhatsApp
  const connectWhatsApp = useMutation({
    mutationFn: async () => {
      // First save connection data
      const payload = {
        evolution_api_url: connForm.evolution_api_url,
        evolution_api_key: connForm.evolution_api_key,
        instance_name: connForm.instance_name,
        openai_api_key: connForm.openai_api_key,
        openai_model: connForm.openai_model,
        updated_at: new Date().toISOString(),
      };

      if (connection) {
        const { error } = await supabase
          .from("whatsapp_connections")
          .update(payload as any)
          .eq("business_id", businessId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_connections")
          .insert({ ...payload, business_id: businessId! } as any);
        if (error) throw error;
      }

      // Call edge function to create instance and get QR code
      const { data, error } = await supabase.functions.invoke("whatsapp-connect", {
        body: {
          evolution_api_url: connForm.evolution_api_url,
          evolution_api_key: connForm.evolution_api_key,
          instance_name: connForm.instance_name,
          business_id: businessId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] });
      if (data?.qr_code) {
        setQrCode(data.qr_code);
        toast({ title: "Escaneie o QR Code com seu WhatsApp!" });
      } else {
        toast({ title: "WhatsApp conectado com sucesso!" });
      }
    },
    onError: (e: any) => toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" }),
  });

  // Disconnect
  const disconnectWhatsApp = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("whatsapp_connections")
        .update({ status: "disconnected", qr_code: null, updated_at: new Date().toISOString() } as any)
        .eq("business_id", businessId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] });
      setQrCode(null);
      toast({ title: "WhatsApp desconectado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const isConnected = connection?.status === "connected";

  if (isLoading) return <div className="text-sm text-muted-foreground py-4">Carregando...</div>;

  return (
    <div className="space-y-6">
      {/* Section A - AI Data */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Dados para a IA</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Horário de funcionamento</Label>
            <Input
              placeholder="Ex: Seg-Sex 9h-19h, Sab 9h-17h"
              value={aiForm.working_hours}
              onChange={(e) => setAiForm({ ...aiForm, working_hours: e.target.value })}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Serviços e preços</Label>
            <Textarea
              placeholder="Liste seus serviços com preços. Ex: Corte masculino - R$ 45, Barba - R$ 30..."
              value={aiForm.services_info}
              onChange={(e) => setAiForm({ ...aiForm, services_info: e.target.value })}
              className="bg-background border-border text-foreground min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Instruções personalizadas para a IA</Label>
            <Textarea
              value={aiForm.system_prompt}
              onChange={(e) => setAiForm({ ...aiForm, system_prompt: e.target.value })}
              className="bg-background border-border text-foreground min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">Defina como a IA deve se comportar, o tom de voz e o que pode ou não fazer.</p>
          </div>
          <Button variant="emerald" size="sm" onClick={() => saveAiData.mutate()} disabled={saveAiData.isPending}>
            {saveAiData.isPending ? "Salvando..." : "Salvar dados"}
          </Button>
        </div>
      </div>

      {/* Section B - WhatsApp Connection */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isConnected ? <Wifi className="h-4 w-4 text-primary" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
            <h3 className="text-base font-semibold text-foreground">Conexão WhatsApp</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isConnected ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-primary" : "bg-destructive"}`} />
            {isConnected ? "Conectado" : "Desconectado"}
          </span>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="rounded-md bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-foreground">
                <span className="font-medium">Número conectado:</span> {connection?.phone_number || "Não identificado"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Instância: {(connection as any)?.instance_name || "—"}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => disconnectWhatsApp.mutate()}
              disabled={disconnectWhatsApp.isPending}
            >
              {disconnectWhatsApp.isPending ? "Desconectando..." : "Desconectar"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">URL da Evolution API</Label>
                <Input
                  placeholder="https://minha-evolution-api.com"
                  value={connForm.evolution_api_url}
                  onChange={(e) => setConnForm({ ...connForm, evolution_api_url: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">API Key da Evolution API</Label>
                <Input
                  type="password"
                  placeholder="Sua API Key"
                  value={connForm.evolution_api_key}
                  onChange={(e) => setConnForm({ ...connForm, evolution_api_key: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome da instância</Label>
              <Input
                placeholder="barbearia-joao (sem espaços)"
                value={connForm.instance_name}
                onChange={(e) => setConnForm({ ...connForm, instance_name: e.target.value.replace(/\s/g, "-").toLowerCase() })}
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Chave da API OpenAI</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={connForm.openai_api_key}
                  onChange={(e) => setConnForm({ ...connForm, openai_api_key: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Modelo da IA</Label>
                <Select value={connForm.openai_model} onValueChange={(v) => setConnForm({ ...connForm, openai_model: v })}>
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">gpt-4o-mini (Econômico)</SelectItem>
                    <SelectItem value="gpt-4o">gpt-4o (Avançado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="emerald"
              onClick={() => connectWhatsApp.mutate()}
              disabled={connectWhatsApp.isPending || !connForm.evolution_api_url || !connForm.evolution_api_key || !connForm.instance_name}
            >
              {connectWhatsApp.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Conectando...</>
              ) : "Conectar WhatsApp"}
            </Button>

            {/* QR Code */}
            {qrCode && (
              <div className="rounded-lg border border-border bg-background p-6 flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-foreground">Escaneie o QR Code com seu WhatsApp</p>
                <img
                  src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 rounded-lg"
                />
                <p className="text-xs text-muted-foreground">Abra o WhatsApp → Aparelhos conectados → Conectar aparelho</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppConfig;
