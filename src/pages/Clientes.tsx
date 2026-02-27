import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Plus, Phone, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Clientes = () => {
  const { businessId } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
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
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update({ name: values.name, phone: values.phone, notes: values.notes })
          .eq("id", editingClient.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("clients")
          .insert({ business_id: businessId!, name: values.name, phone: values.phone, notes: values.notes });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", businessId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editingClient ? "Cliente atualizado" : "Cliente criado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients", businessId] });
      toast({ title: "Cliente removido" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ name: "", phone: "", notes: "" });
    setEditingClient(null);
  };

  const openEdit = (client: any) => {
    setEditingClient(client);
    setForm({ name: client.name, phone: client.phone || "", notes: client.notes || "" });
    setDialogOpen(true);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const filtered = clients.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{clients.length} clientes cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="emerald" size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Novo cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingClient ? "Editar cliente" : "Novo cliente"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-background border-border text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-background border-border text-foreground"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Observacoes</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="bg-background border-border text-foreground"
                />
              </div>
              <Button type="submit" variant="emerald" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="pl-9 bg-card border-border text-foreground"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Cliente</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Telefone</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Observacoes</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((client: any) => (
                  <tr key={client.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-muted-foreground">
                            {client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <button onClick={() => navigate(`/dashboard/clientes/${client.id}`)} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{client.name}</button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {client.phone || "-"}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell truncate max-w-xs">
                      {client.notes || "-"}
                    </td>
                    <td className="px-3 py-3.5">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem onClick={() => openEdit(client)} className="text-foreground">
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate(client.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
