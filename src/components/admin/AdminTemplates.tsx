import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Send, RefreshCw, Trash2, FlaskConical, ShieldCheck, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCall } from "./AdminOverview";

const statusBadge: Record<string, { label: string; cls: string }> = {
  draft: { label: "Rascunho", cls: "bg-zinc-800 text-zinc-300" },
  pending: { label: "Em análise", cls: "bg-yellow-500/15 text-yellow-300" },
  approved: { label: "Aprovado", cls: "bg-emerald-500/15 text-emerald-300" },
  rejected: { label: "Rejeitado", cls: "bg-red-500/15 text-red-300" },
  paused: { label: "Pausado", cls: "bg-orange-500/15 text-orange-300" },
};

const maskBr = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

type Form = {
  id?: string;
  name: string;
  category: string;
  language: string;
  body: string;
  footer: string;
  buttons: string[];
  body_examples: string[];
};

const emptyForm: Form = { name: "", category: "UTILITY", language: "pt_BR", body: "", footer: "", buttons: [], body_examples: [] };

const inputCls = "bg-zinc-950 border-zinc-800 text-zinc-100";

const AdminTemplates = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const err = (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" });

  // ===== Número central =====
  const [central, setCentral] = useState<any>(null);
  const checkCentral = useMutation({
    mutationFn: () => adminCall("central-status"),
    onSuccess: (d) => setCentral(d),
    onError: err,
  });

  // ===== Modelos =====
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin-wa-templates"],
    queryFn: () => adminCall("list-templates"),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-wa-templates"] });

  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<any>, ok: string) => {
    setBusy(key);
    try {
      await fn();
      toast({ title: ok });
      refresh();
    } catch (e: any) {
      err(e);
    } finally {
      setBusy(null);
    }
  };

  // Editor
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const varCount = useMemo(() => {
    const nums = [...form.body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    return nums.length ? Math.max(...nums) : 0;
  }, [form.body]);
  const preview = useMemo(
    () => form.body.replace(/\{\{(\d+)\}\}/g, (_m, n) => form.body_examples[Number(n) - 1] || `{{${n}}}`),
    [form.body, form.body_examples],
  );

  const saveTpl = useMutation({
    mutationFn: () =>
      adminCall("save-template", {
        template: { ...form, body_examples: form.body_examples.slice(0, varCount), buttons: form.buttons.filter((b) => b.trim()) },
      }),
    onSuccess: () => {
      toast({ title: "Modelo salvo como rascunho" });
      setOpen(false);
      refresh();
    },
    onError: err,
  });

  // Teste
  const [testTpl, setTestTpl] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const sendTest = useMutation({
    mutationFn: () => adminCall("send-test-template", { template_name: testTpl, to_phone: testPhone }),
    onSuccess: (d) => {
      toast({ title: "Mensagem de teste enviada", description: d?.message_id ? `ID: ${d.message_id}` : undefined });
      setTestTpl(null);
      setTestPhone("");
    },
    onError: err,
  });

  return (
    <>
      {/* Número central */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Número central de lembretes</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Número oficial do ProGestão+ usado para enviar lembretes e modelos.</p>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            onClick={() => checkCentral.mutate()} disabled={checkCentral.isPending}>
            {checkCentral.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
            Verificar conexão
          </Button>
        </div>
        {central && (
          central.token_ok ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div><p className="text-[11px] text-zinc-500">Número</p><p className="text-zinc-100">{central.display_phone_number || "—"}</p></div>
              <div><p className="text-[11px] text-zinc-500">Nome verificado</p><p className="text-zinc-100">{central.verified_name || "—"}</p></div>
              <div><p className="text-[11px] text-zinc-500">Qualidade</p><p className="text-zinc-100">{central.quality_rating || "—"}</p></div>
              <div><p className="text-[11px] text-zinc-500">Status</p><p className="text-emerald-400">Conexão OK</p></div>
            </div>
          ) : (
            <p className="text-sm text-red-400">Falha na conexão: {central.error}</p>
          )
        )}
      </div>

      {/* Modelos */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-zinc-200">Modelos de mensagem</h2>
          <Button size="sm" className="h-8 text-xs bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
            onClick={() => { setForm(emptyForm); setOpen(true); }}>
            <Plus className="h-3 w-3 mr-1" /> Novo modelo
          </Button>
        </div>
        {isLoading ? (
          <p className="text-zinc-400 text-sm">Carregando...</p>
        ) : (
          <div className="rounded-lg border border-zinc-800 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-950 text-zinc-400 text-left">
                  <th className="px-3 py-2 font-medium">Nome</th>
                  <th className="px-3 py-2 font-medium">Categoria</th>
                  <th className="px-3 py-2 font-medium">Idioma</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {(templates as any[]).map((t) => {
                  const b = statusBadge[t.status] || statusBadge.draft;
                  const editable = t.status === "draft" || t.status === "rejected";
                  return (
                    <tr key={t.id} className="border-t border-zinc-800 text-zinc-300 align-top">
                      <td className="px-3 py-2">
                        <span className="font-mono text-xs">{t.name}</span>
                        {t.rejection_reason && <p className="text-[11px] text-red-400 mt-1">Motivo: {t.rejection_reason}</p>}
                      </td>
                      <td className="px-3 py-2 text-xs">{t.category}</td>
                      <td className="px-3 py-2 text-xs">{t.language}</td>
                      <td className="px-3 py-2"><span className={`text-[11px] px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span></td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {editable && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => {
                                  setForm({ id: t.id, name: t.name, category: t.category, language: t.language, body: t.body, footer: t.footer || "", buttons: t.buttons || [], body_examples: t.body_examples || [] });
                                  setOpen(true);
                                }}>
                                <Pencil className="h-3 w-3 mr-1" /> Editar
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                disabled={busy === `s-${t.id}`}
                                onClick={() => run(`s-${t.id}`, () => adminCall("submit-template", { id: t.id }), "Modelo enviado para aprovação")}>
                                {busy === `s-${t.id}` ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                                Enviar para aprovação
                              </Button>
                            </>
                          )}
                          {t.meta_template_id && (
                            <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                              disabled={busy === `y-${t.id}`}
                              onClick={() => run(`y-${t.id}`, () => adminCall("sync-template-status", { id: t.id }), "Status atualizado")}>
                              {busy === `y-${t.id}` ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                              Atualizar status
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                            disabled={t.status !== "approved"}
                            title={t.status !== "approved" ? "Disponível após aprovação da Meta" : undefined}
                            onClick={() => setTestTpl(t.name)}>
                            <FlaskConical className="h-3 w-3 mr-1" /> Enviar teste
                          </Button>
                          <Button size="sm" variant="destructive" className="h-7 text-xs"
                            disabled={busy === `d-${t.id}`}
                            onClick={() => {
                              if (!confirm(`Excluir o modelo ${t.name}?`)) return;
                              run(`d-${t.id}`, () => adminCall("delete-template", { id: t.id }), "Modelo excluído");
                            }}>
                            <Trash2 className="h-3 w-3 mr-1" /> Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(templates as any[]).length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-500">Nenhum modelo cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="admin-scope bg-zinc-900 border-zinc-800 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-zinc-100">{form.id ? "Editar modelo" : "Novo modelo"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Nome (minúsculas, números e _)</Label>
                <Input className={inputCls} value={form.name} disabled={!!form.id}
                  onChange={(e) => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Categoria</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">UTILITY</SelectItem>
                      <SelectItem value="MARKETING">MARKETING</SelectItem>
                      <SelectItem value="AUTHENTICATION">AUTHENTICATION</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400">Idioma</Label>
                  <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt_BR">pt_BR</SelectItem>
                      <SelectItem value="en_US">en_US</SelectItem>
                      <SelectItem value="es">es</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Corpo ({form.body.length}/1024) — use {"{{1}}"}, {"{{2}}"}...</Label>
                <Textarea className={`${inputCls} min-h-[110px] text-xs`} maxLength={1024} value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })} />
              </div>
              {varCount > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">Exemplos das variáveis</Label>
                  {Array.from({ length: varCount }, (_, i) => (
                    <Input key={i} className={`${inputCls} h-8 text-xs`} placeholder={`Exemplo para {{${i + 1}}}`}
                      value={form.body_examples[i] || ""}
                      onChange={(e) => {
                        const ex = [...form.body_examples];
                        ex[i] = e.target.value;
                        setForm({ ...form, body_examples: ex });
                      }} />
                  ))}
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Rodapé (opcional, {form.footer.length}/60)</Label>
                <Input className={inputCls} maxLength={60} value={form.footer} onChange={(e) => setForm({ ...form, footer: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-400">Botões de resposta rápida (até 3)</Label>
                {form.buttons.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <Input className={`${inputCls} h-8 text-xs`} maxLength={25} value={b}
                      onChange={(e) => { const bs = [...form.buttons]; bs[i] = e.target.value; setForm({ ...form, buttons: bs }); }} />
                    <Button size="sm" variant="ghost" className="h-8 text-zinc-400"
                      onClick={() => setForm({ ...form, buttons: form.buttons.filter((_, j) => j !== i) })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {form.buttons.length < 3 && (
                  <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setForm({ ...form, buttons: [...form.buttons, ""] })}>
                    <Plus className="h-3 w-3 mr-1" /> Adicionar botão
                  </Button>
                )}
              </div>
            </div>

            {/* Pré-visualização */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-400">Pré-visualização</Label>
              <div className="rounded-lg p-4 min-h-[200px]" style={{ background: "hsl(150 15% 12%)" }}>
                <div className="max-w-[90%] rounded-lg rounded-tl-none p-3 shadow-sm" style={{ background: "hsl(160 40% 18%)" }}>
                  <p className="text-[13px] text-zinc-100 whitespace-pre-wrap break-words">{preview || "Digite o corpo da mensagem..."}</p>
                  {form.footer && <p className="text-[11px] text-zinc-400 mt-2">{form.footer}</p>}
                </div>
                {form.buttons.filter((b) => b.trim()).length > 0 && (
                  <div className="max-w-[90%] mt-1 space-y-1">
                    {form.buttons.filter((b) => b.trim()).map((b, i) => (
                      <div key={i} className="rounded-lg py-2 text-center text-[13px] text-sky-300" style={{ background: "hsl(160 40% 18%)" }}>{b}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="ghost" className="text-zinc-400" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200" onClick={() => saveTpl.mutate()} disabled={saveTpl.isPending}>
              {saveTpl.isPending ? "Salvando..." : "Salvar rascunho"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teste */}
      <Dialog open={!!testTpl} onOpenChange={(o) => !o && setTestTpl(null)}>
        <DialogContent className="admin-scope bg-zinc-900 border-zinc-800 max-w-sm">
          <DialogHeader><DialogTitle className="text-zinc-100">Enviar teste — {testTpl}</DialogTitle></DialogHeader>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Telefone de destino</Label>
            <Input className={inputCls} placeholder="(69) 99999-9999" value={testPhone} onChange={(e) => setTestPhone(maskBr(e.target.value))} />
            <p className="text-[11px] text-zinc-500">Os exemplos cadastrados no modelo serão usados como conteúdo.</p>
          </div>
          <DialogFooter>
            <Button size="sm" className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              disabled={sendTest.isPending || testPhone.replace(/\D/g, "").length < 10}
              onClick={() => sendTest.mutate()}>
              {sendTest.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminTemplates;
