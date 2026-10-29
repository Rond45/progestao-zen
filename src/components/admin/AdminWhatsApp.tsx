import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Wifi, WifiOff, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCall } from "./AdminOverview";
import AdminTemplates from "./AdminTemplates";

const DEFAULT_PROMPT = `Você é {ai_name}, atendente virtual do {nome_estabelecimento}. Responda sempre em português brasileiro, seja cordial e objetivo. Horário de funcionamento: {working_hours}. Serviços disponíveis: {services_info}. Você pode verificar horários disponíveis, fazer agendamentos e informar sobre serviços e preços. Nunca invente informações não fornecidas.`;

const AdminWhatsApp = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Global config
  const { data: configData } = useQuery({
    queryKey: ["admin-platform-config"],
    queryFn: () => adminCall("get-platform-config"),
  });

  const [globalForm, setGlobalForm] = useState({
    default_ai_name: "",
    default_ai_tone: "",
    default_system_prompt: DEFAULT_PROMPT,
  });

  useEffect(() => {
    if (configData?.config) {
      const cfg = configData.config as Record<string, string>;
      setGlobalForm({
        default_ai_name: cfg.default_ai_name || "Atendente",
        default_ai_tone: cfg.default_ai_tone || "Cordial, objetivo e profissional",
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

  // Conexões oficiais (Meta)
  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ["admin-whatsapp-instances"],
    queryFn: () => adminCall("get-instances"),
  });

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-zinc-100">WhatsApp IA</h1>

      {/* SEÇÃO A — Configurações Globais */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Configuração Central da IA</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Credenciais técnicas (Evolution API, OpenAI) são gerenciadas via secrets do servidor e não aparecem aqui.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Nome padrão da IA</Label>
            <Input
              placeholder="Ex: Sofia, Bruno, Assistente"
              value={globalForm.default_ai_name}
              onChange={(e) => setGlobalForm({ ...globalForm, default_ai_name: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Tom de atendimento padrão</Label>
            <Input
              placeholder="Ex: Cordial, objetivo e profissional"
              value={globalForm.default_ai_tone}
              onChange={(e) => setGlobalForm({ ...globalForm, default_ai_tone: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Prompt padrão global</Label>
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
      {/* Conexões oficiais (Meta) */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Conexões oficiais (Meta)</h2>
        {loadingInstances ? (
          <p className="text-zinc-400 text-sm">Carregando...</p>
        ) : (
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 text-left">
                  <th className="px-3 py-2 font-medium">Negócio</th>
                  <th className="px-3 py-2 font-medium">Número</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(instances ?? []).map((inst: any) => {
                  const st = inst.status === "connected" ? "Conectado" : inst.status === "pending" ? "Pendente" : "Desconectado";
                  const cls = inst.status === "connected" ? "text-emerald-400" : inst.status === "pending" ? "text-yellow-400" : "text-zinc-500";
                  return (
                    <tr key={inst.business_id} className="border-t border-zinc-800 text-zinc-300">
                      <td className="px-3 py-2">
                        <span>{inst.business_name}</span>
                        <span className="text-[10px] text-zinc-500 ml-2">{inst.vertical}</span>
                      </td>
                      <td className="px-3 py-2">{inst.phone_number || "—"}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs ${cls}`}>
                            {inst.status === "connected" ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {st}
                          </span>
                          {inst.is_on_biz_app && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300">
                              <Smartphone className="h-3 w-3" /> Coexistência
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(instances ?? []).length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">Nenhum negócio cadastrado na plataforma.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminTemplates />
    </div>
  );
};

export default AdminWhatsApp;
