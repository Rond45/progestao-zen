import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, Loader2, QrCode, Wifi, WifiOff, Plus, Copy, Share2, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCall } from "./AdminOverview";

const DEFAULT_PROMPT = `Você é {ai_name}, atendente virtual do {nome_estabelecimento}. Responda sempre em português brasileiro, seja cordial e objetivo. Horário de funcionamento: {working_hours}. Serviços disponíveis: {services_info}. Você pode verificar horários disponíveis, fazer agendamentos e informar sobre serviços e preços. Nunca invente informações não fornecidas.`;

const AdminWhatsApp = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Global config
  const { data: configData } = useQuery({
    queryKey: ["admin-platform-config"],
    queryFn: () => adminCall("get-platform-config"),
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [globalForm, setGlobalForm] = useState({
    evolution_api_url: "",
    evolution_api_key: "",
    openai_api_key: "",
    openai_model: "gpt-4o-mini",
    default_system_prompt: DEFAULT_PROMPT,
  });

  useEffect(() => {
    if (configData?.config) {
      const cfg = configData.config as Record<string, string>;
      setGlobalForm({
        evolution_api_url: cfg.evolution_api_url || "",
        evolution_api_key: cfg.evolution_api_key || "",
        openai_api_key: cfg.openai_api_key || "",
        openai_model: cfg.openai_model || "gpt-4o-mini",
        default_system_prompt: cfg.default_system_prompt || DEFAULT_PROMPT,
      });
    }
  }, [configData]);

  const saveGlobal = useMutation({
    mutationFn: () => adminCall("save-platform-config", { config: globalForm }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-platform-config"] });
      toast({ title: "Configurações globais salvas!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Instances
  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ["admin-whatsapp-instances"],
    queryFn: () => adminCall("get-instances"),
  });

  const [qrModal, setQrModal] = useState<{ open: boolean; qr: string; name: string; businessId: string }>({
    open: false, qr: "", name: "", businessId: "",
  });
  const qrImgRef = useRef<HTMLImageElement>(null);

  const createInstance = useMutation({
    mutationFn: (businessId: string) => adminCall("create-instance", { business_id: businessId }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-instances"] });
      if (data?.qr_code) {
        setQrModal({ open: true, qr: data.qr_code, name: data.instance_name || "", businessId: "" });
        toast({ title: "Instância criada! Escaneie o QR Code." });
      } else {
        toast({ title: "Instância criada com sucesso!" });
      }
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const reconnectInstance = useMutation({
    mutationFn: (businessId: string) => adminCall("create-instance", { business_id: businessId }),
    onSuccess: (data, businessId) => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-instances"] });
      if (data?.qr_code) {
        setQrModal({ open: true, qr: data.qr_code, name: data.instance_name || "", businessId });
        toast({ title: "QR Code gerado com sucesso!" });
      } else {
        toast({ title: "Instância atualizada, mas QR Code não disponível. Tente novamente." });
      }
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const copyQrImage = async () => {
    try {
      const imgSrc = qrModal.qr.startsWith("data:") ? qrModal.qr : `data:image/png;base64,${qrModal.qr}`;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = imgSrc;
      await new Promise((resolve) => { img.onload = resolve; });
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast({ title: "QR Code copiado!" });
    } catch {
      toast({ title: "Erro ao copiar", description: "Seu navegador pode não suportar esta função.", variant: "destructive" });
    }
  };

  const shareQr = async (method: "whatsapp" | "email") => {
    const text = `QR Code para conectar o WhatsApp da instância "${qrModal.name}". Abra o WhatsApp no celular, vá em Dispositivos conectados e escaneie o QR Code.`;
    if (method === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n\n(O QR Code foi copiado para a área de transferência — cole na conversa)")}`, "_blank");
      copyQrImage();
    } else {
      const subject = encodeURIComponent(`QR Code WhatsApp — ${qrModal.name}`);
      const body = encodeURIComponent(text);
      window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    }
  };

  const disconnectInstance = useMutation({
    mutationFn: (businessId: string) => adminCall("disconnect-instance", { business_id: businessId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-whatsapp-instances"] });
      toast({ title: "Instância desconectada." });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-zinc-100">WhatsApp IA</h1>

      {/* SEÇÃO A — Configurações Globais */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Configurações Globais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">URL da Evolution API</Label>
            <Input
              placeholder="https://minha-evolution-api.com"
              value={globalForm.evolution_api_url}
              onChange={(e) => setGlobalForm({ ...globalForm, evolution_api_url: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">API Key da Evolution API</Label>
            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={globalForm.evolution_api_key}
                onChange={(e) => setGlobalForm({ ...globalForm, evolution_api_key: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Chave da API OpenAI</Label>
            <div className="relative">
              <Input
                type={showOpenAI ? "text" : "password"}
                value={globalForm.openai_api_key}
                onChange={(e) => setGlobalForm({ ...globalForm, openai_api_key: e.target.value })}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Modelo padrão</Label>
            <Select value={globalForm.openai_model} onValueChange={(v) => setGlobalForm({ ...globalForm, openai_model: v })}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">gpt-4o-mini (Econômico)</SelectItem>
                <SelectItem value="gpt-4o">gpt-4o (Avançado)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Prompt base do sistema</Label>
          <Textarea
            value={globalForm.default_system_prompt}
            onChange={(e) => setGlobalForm({ ...globalForm, default_system_prompt: e.target.value })}
            className="bg-zinc-950 border-zinc-800 text-zinc-100 min-h-[120px] text-xs"
          />
          <p className="text-[10px] text-zinc-500">
            Variáveis disponíveis: {"{ai_name}"}, {"{nome_estabelecimento}"}, {"{working_hours}"}, {"{services_info}"}
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => saveGlobal.mutate()}
          disabled={saveGlobal.isPending}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
        >
          {saveGlobal.isPending ? "Salvando..." : "Salvar configurações globais"}
        </Button>
      </div>

      {/* SEÇÃO B — Instâncias por Cliente */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Instâncias por Cliente</h2>

        {loadingInstances ? (
          <p className="text-zinc-400 text-sm">Carregando...</p>
        ) : (
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 text-left">
                  <th className="px-3 py-2 font-medium">Negócio</th>
                  <th className="px-3 py-2 font-medium">Número</th>
                  <th className="px-3 py-2 font-medium">Atendente</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Instância</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(instances ?? []).map((inst: any) => (
                  <tr key={inst.business_id} className="border-t border-zinc-800 text-zinc-300">
                    <td className="px-3 py-2">
                      <div>
                        <span>{inst.business_name}</span>
                        <span className="text-[10px] text-zinc-500 ml-2">{inst.vertical}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">{inst.phone_number || "—"}</td>
                    <td className="px-3 py-2">{inst.ai_name || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 text-xs ${
                        inst.status === "connected" ? "text-emerald-400" :
                        inst.status === "pending" ? "text-yellow-400" :
                        inst.has_connection ? "text-zinc-500" : "text-zinc-600"
                      }`}>
                        {inst.status === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {inst.status === "connected" ? "Conectado" :
                         inst.status === "pending" ? "Pendente" :
                         inst.has_connection ? "Desconectado" : "Não configurado"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{inst.instance_name || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        {!inst.instance_name ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            onClick={() => createInstance.mutate(inst.business_id)}
                            disabled={createInstance.isPending}
                          >
                            {createInstance.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                            Criar instância
                          </Button>
                        ) : (
                          <>
                            {inst.qr_code ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => setQrModal({ open: true, qr: inst.qr_code, name: inst.business_name, businessId: inst.business_id })}
                              >
                                <QrCode className="h-3 w-3 mr-1" />
                                Ver QR Code
                              </Button>
                            ) : inst.status !== "connected" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => reconnectInstance.mutate(inst.business_id)}
                                disabled={reconnectInstance.isPending}
                              >
                                {reconnectInstance.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                Ver QR Code
                              </Button>
                            ) : null}
                            {inst.status === "connected" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => disconnectInstance.mutate(inst.business_id)}
                                disabled={disconnectInstance.isPending}
                              >
                                Desconectar
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(instances ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                      Nenhum negócio cadastrado na plataforma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <Dialog open={qrModal.open} onOpenChange={(o) => !o && setQrModal({ ...qrModal, open: false })}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">QR Code — {qrModal.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrModal.qr ? (
              <>
                <img
                  ref={qrImgRef}
                  src={qrModal.qr.startsWith("data:") ? qrModal.qr : `data:image/png;base64,${qrModal.qr}`}
                  alt="QR Code"
                  className="w-64 h-64 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-zinc-400 text-center max-w-[280px]">
                  Peça ao cliente para abrir o WhatsApp, ir em <strong className="text-zinc-200">Dispositivos conectados</strong> e escanear este QR Code.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={copyQrImage}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copiar imagem
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => shareQr("whatsapp")}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Enviar via WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => shareQr("email")}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    Enviar por e-mail
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-zinc-400 text-sm">QR Code não disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWhatsApp;
