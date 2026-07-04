import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCall } from "./AdminOverview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminAvisos = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({ mensagem: "", tipo: "info" as "info" | "alerta" });

  const { data: avisos = [] } = useQuery({
    queryKey: ["admin-avisos"],
    queryFn: () => adminCall("list-avisos"),
  });

  const create = useMutation({
    mutationFn: () => adminCall("create-aviso", { ...form, ativo: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-avisos"] });
      setForm({ mensagem: "", tipo: "info" });
      toast({ title: "Aviso publicado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: (a: any) => adminCall("toggle-aviso", { id: a.id, ativo: !a.ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-avisos"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminCall("delete-aviso", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-avisos"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Avisos Globais</h1>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Novo aviso</h2>
        <div className="space-y-1">
          <Label className="text-xs text-zinc-400">Mensagem</Label>
          <Textarea value={form.mensagem} onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            className="bg-zinc-950 border-zinc-800 text-zinc-100 min-h-[80px]" />
        </div>
        <div className="space-y-1 max-w-xs">
          <Label className="text-xs text-zinc-400">Tipo</Label>
          <Select value={form.tipo} onValueChange={(v: any) => setForm({ ...form, tipo: v })}>
            <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Informativo</SelectItem>
              <SelectItem value="alerta">Alerta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => create.mutate()} disabled={!form.mensagem.trim()}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          <Megaphone className="h-4 w-4 mr-1" /> Publicar aviso
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-2">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Avisos publicados</h2>
        {avisos.length === 0 && <p className="text-zinc-500 text-sm">Nenhum aviso.</p>}
        {avisos.map((a: any) => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded border border-zinc-800 bg-zinc-950">
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
              a.tipo === "alerta" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
            }`}>{a.tipo}</span>
            <p className="flex-1 text-sm text-zinc-200">{a.mensagem}</p>
            <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => toggle.mutate(a)}>
              {a.ativo ? "Desativar" : "Ativar"}
            </Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => del.mutate(a.id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAvisos;