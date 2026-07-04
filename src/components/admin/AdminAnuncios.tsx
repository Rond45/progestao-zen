import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { adminCall } from "./AdminOverview";

const MAX_SIZE = 2 * 1024 * 1024;

const AdminAnuncios = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    titulo: "",
    link_checkout: "",
    segmento: "ambos" as "barbearia" | "salao" | "ambos",
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);

  const { data: anuncios = [], isLoading } = useQuery({
    queryKey: ["admin-anuncios"],
    queryFn: () => adminCall("list-anuncios"),
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.file) throw new Error("Selecione uma imagem.");
      if (form.file.size > MAX_SIZE) throw new Error("Imagem maior que 2MB.");
      if (!form.titulo.trim()) throw new Error("Título é obrigatório.");
      setUploading(true);
      const ext = form.file.name.split(".").pop() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("anuncios").upload(path, form.file);
      if (upErr) throw upErr;
      return adminCall("create-anuncio", {
        titulo: form.titulo,
        imagem_url: path,
        link_checkout: form.link_checkout || null,
        segmento: form.segmento,
        ativo: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-anuncios"] });
      setForm({ titulo: "", link_checkout: "", segmento: "ambos", file: null });
      toast({ title: "Anúncio criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    onSettled: () => setUploading(false),
  });

  const toggle = useMutation({
    mutationFn: (a: any) => adminCall("toggle-anuncio", { id: a.id, ativo: !a.ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-anuncios"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => adminCall("delete-anuncio", { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-anuncios"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Anúncios (Popups)</h1>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Novo anúncio</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Título</Label>
            <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-zinc-100" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Link de checkout</Label>
            <Input placeholder="https://..." value={form.link_checkout}
              onChange={(e) => setForm({ ...form, link_checkout: e.target.value })}
              className="bg-zinc-950 border-zinc-800 text-zinc-100" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Segmento</Label>
            <Select value={form.segmento} onValueChange={(v: any) => setForm({ ...form, segmento: v })}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-zinc-100"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ambos">Ambos</SelectItem>
                <SelectItem value="barbearia">Barbearia</SelectItem>
                <SelectItem value="salao">Salão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-zinc-400">Imagem (quadrada 1:1 ou retrato 4:5, máx 2MB)</Label>
            <Input type="file" accept="image/*"
              onChange={(e) => setForm({ ...form, file: e.target.files?.[0] || null })}
              className="bg-zinc-950 border-zinc-800 text-zinc-100" />
          </div>
        </div>
        <Button size="sm" onClick={() => create.mutate()} disabled={uploading}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
          Publicar anúncio
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="text-sm font-semibold text-zinc-200 mb-3">Anúncios cadastrados</h2>
        {isLoading ? <p className="text-zinc-500 text-sm">Carregando...</p> : (
          <div className="space-y-2">
            {anuncios.length === 0 && <p className="text-zinc-500 text-sm">Nenhum anúncio ainda.</p>}
            {anuncios.map((a: any) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded border border-zinc-800 bg-zinc-950">
                <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{a.titulo}</p>
                  <p className="text-[11px] text-zinc-500">Segmento: {a.segmento}</p>
                </div>
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
        )}
      </div>
    </div>
  );
};

export default AdminAnuncios;