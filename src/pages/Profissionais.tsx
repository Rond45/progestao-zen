import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Profissionais = () => {
  const { businessId } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", specialty: "" });

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("business_id", businessId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      if (editing) {
        const { error } = await supabase.from("professionals").update({ name: values.name, specialty: values.specialty }).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("professionals").insert({ business_id: businessId!, name: values.name, specialty: values.specialty });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals", businessId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editing ? "Profissional atualizado" : "Profissional adicionado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("professionals").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["professionals", businessId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("professionals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professionals", businessId] });
      toast({ title: "Profissional removido" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setForm({ name: "", specialty: "" }); setEditing(null); };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, specialty: p.specialty || "" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profissionais</h1>
          <p className="text-sm text-muted-foreground mt-1">{professionals.length} profissionais cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="emerald" size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo profissional
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editing ? "Editar profissional" : "Novo profissional"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border text-foreground" required />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Especialidade</Label>
                <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className="bg-background border-border text-foreground" />
              </div>
              <Button type="submit" variant="emerald" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum profissional cadastrado ainda.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {professionals.map((p: any) => (
            <div key={p.id} className={`rounded-lg border bg-card p-5 transition-colors group ${p.active ? "border-border hover:border-primary/30" : "border-border/50 opacity-60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">{p.name[0]}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                    <span className="text-xs text-muted-foreground">{p.specialty || "Geral"}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem onClick={() => openEdit(p)} className="text-foreground"><Pencil className="h-3.5 w-3.5 mr-2" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })} className="text-foreground">
                      {p.active ? <><UserX className="h-3.5 w-3.5 mr-2" /> Desativar</> : <><UserCheck className="h-3.5 w-3.5 mr-2" /> Ativar</>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteMutation.mutate(p.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${p.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {p.active ? "Ativo" : "Inativo"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profissionais;
