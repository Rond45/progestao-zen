import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Package, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

const Produtos = () => {
  const { businessId } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", stock_qty: "0", price: "" });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", businessId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: movements = [] } = useQuery({
    queryKey: ["product-movements-summary", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_movements")
        .select("product_id, type, qty, total_cents")
        .eq("business_id", businessId!);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const getProductStats = (productId: string) => {
    const pm = movements.filter((m: any) => m.product_id === productId);
    const sold = pm.filter((m: any) => m.type === "sale").reduce((s: number, m: any) => s + m.qty, 0);
    const consumed = pm.filter((m: any) => m.type === "consumption").reduce((s: number, m: any) => s + m.qty, 0);
    const revenue = pm.filter((m: any) => m.type === "sale").reduce((s: number, m: any) => s + (m.total_cents || 0), 0);
    return { sold, consumed, revenue };
  };

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const payload = {
        name: values.name,
        stock_qty: parseInt(values.stock_qty),
        price_cents: Math.round(parseFloat(values.price) * 100),
      };
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert({ ...payload, business_id: businessId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      setDialogOpen(false);
      resetForm();
      toast({ title: editing ? "Produto atualizado" : "Produto criado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", businessId] });
      toast({ title: "Produto removido" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setForm({ name: "", stock_qty: "0", price: "" }); setEditing(null); };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, stock_qty: String(p.stock_qty), price: (p.price_cents / 100).toFixed(2) });
    setDialogOpen(true);
  };

  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} produtos cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="emerald" size="sm" onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editing ? "Editar produto" : "Novo produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border text-foreground" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Estoque</Label>
                  <Input type="number" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} className="bg-background border-border text-foreground" required min="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Preco (R$)</Label>
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-background border-border text-foreground" required min="0" />
                </div>
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
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum produto cadastrado ainda.</div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Produto</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Estoque</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Preco</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Vendidos</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Faturamento</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((p: any) => {
                  const stats = getProductStats(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-medium ${p.stock_qty <= 5 ? "text-destructive" : "text-foreground"}`}>{p.stock_qty}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm text-foreground">{formatPrice(p.price_cents)}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-muted-foreground hidden sm:table-cell">{stats.sold}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-primary font-medium hidden sm:table-cell">{formatPrice(stats.revenue)}</td>
                      <td className="px-3 py-3.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem onClick={() => openEdit(p)} className="text-foreground"><Pencil className="h-3.5 w-3.5 mr-2" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(p.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Produtos;
