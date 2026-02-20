import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const VendasConsumo = () => {
  const { businessId } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", qty: "1", type: "sale" as string, client_id: "", buyer_name: "" });

  const { data: products = [] } = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("business_id", businessId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["product-movements", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_movements")
        .select("*, products(name), clients(name)")
        .eq("business_id", businessId!)
        .order("occurred_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const product = products.find((p: any) => p.id === values.product_id);
      if (!product) throw new Error("Produto nao encontrado");
      const qty = parseInt(values.qty);
      const unit_price_cents = values.type === "sale" ? product.price_cents : null;
      const total_cents = values.type === "sale" ? product.price_cents * qty : null;
      const { error } = await supabase.from("product_movements").insert({
        business_id: businessId!,
        product_id: values.product_id,
        type: values.type,
        qty,
        unit_price_cents,
        total_cents,
        client_id: values.client_id || null,
        buyer_name: values.buyer_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDialogOpen(false);
      setForm({ product_id: "", qty: "1", type: "sale", client_id: "", buyer_name: "" });
      toast({ title: "Movimento registrado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const typeLabels: Record<string, string> = { sale: "Venda", consumption: "Consumo", adjustment: "Ajuste" };

  const formatPrice = (cents: number | null) => cents != null ? `R$ ${(cents / 100).toFixed(2).replace(".", ",")}` : "-";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas e Consumo</h1>
          <p className="text-sm text-muted-foreground mt-1">Registre movimentacoes de produtos</p>
        </div>
        <Button variant="emerald" size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Novo lancamento
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : movements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma movimentacao registrada ainda.</div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Data</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Produto</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Qtd</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3 hidden sm:table-cell">Total</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3 hidden md:table-cell">Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{format(new Date(m.occurred_at), "dd/MM HH:mm")}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        m.type === "sale" ? "bg-primary/10 text-primary" : m.type === "consumption" ? "bg-secondary text-muted-foreground" : "bg-secondary text-muted-foreground"
                      }`}>
                        {typeLabels[m.type] || m.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-foreground">{m.products?.name || "-"}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-foreground">{m.qty}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-primary font-medium hidden sm:table-cell">{formatPrice(m.total_cents)}</td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{m.clients?.name || m.buyer_name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo lancamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="consumption">Consumo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Produto</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} (estoque: {p.stock_qty})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Quantidade</Label>
              <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} className="bg-background border-border text-foreground" required min="1" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Cliente (opcional)</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">Nenhum</SelectItem>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {!form.client_id && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nome do comprador (opcional)</Label>
                <Input value={form.buyer_name} onChange={(e) => setForm({ ...form, buyer_name: e.target.value })} className="bg-background border-border text-foreground" />
              </div>
            )}
            <Button type="submit" variant="emerald" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendasConsumo;
