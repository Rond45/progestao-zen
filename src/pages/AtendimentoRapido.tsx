import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBusiness } from "@/hooks/useBusiness";
import { usePlan } from "@/hooks/usePlan";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Zap, Loader2, UserPlus, Scissors, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type ServiceItem = { key: string; service_id: string; name: string; price_cents: number };
type ProductItem = { key: string; product_id: string; name: string; qty: number; unit_price_cents: number };

const AVULSO = "__avulso__";

const AtendimentoRapido = () => {
  const { businessId } = useBusiness();
  const { hasAccess } = usePlan();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canProducts = hasAccess("premium");

  const [clientId, setClientId] = useState<string>(AVULSO);
  const [avulsoName, setAvulsoName] = useState("");
  const [professionalId, setProfessionalId] = useState<string>("");
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [pickService, setPickService] = useState("");
  const [pickProduct, setPickProduct] = useState("");
  const [pickQty, setPickQty] = useState("1");
  const [payment, setPayment] = useState("dinheiro");
  const [saving, setSaving] = useState(false);

  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", phone: "" });
  const [creatingClient, setCreatingClient] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients").select("id, name, phone")
        .eq("business_id", businessId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals-basic", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals").select("id, name, specialty, active")
        .eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services").select("id, name, price_cents, duration_minutes")
        .eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products").select("id, name, price_cents, stock_qty")
        .eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId && canProducts,
  });

  const totalServicos = serviceItems.reduce((s, i) => s + i.price_cents, 0);
  const totalProdutos = productItems.reduce((s, i) => s + i.qty * i.unit_price_cents, 0);
  const total = totalServicos + totalProdutos;

  const clientOptions = useMemo(
    () => clients.filter((c) => c.name !== "Cliente Avulso"),
    [clients],
  );

  const addService = () => {
    const s = services.find((x) => x.id === pickService);
    if (!s) return;
    setServiceItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), service_id: s.id, name: s.name, price_cents: s.price_cents },
    ]);
    setPickService("");
  };

  const addProduct = () => {
    const p = products.find((x) => x.id === pickProduct);
    const qty = Math.max(1, parseInt(pickQty || "1", 10) || 1);
    if (!p) return;
    setProductItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), product_id: p.id, name: p.name, qty, unit_price_cents: p.price_cents },
    ]);
    setPickProduct("");
    setPickQty("1");
  };

  const resetComanda = () => {
    setServiceItems([]);
    setProductItems([]);
    setClientId(AVULSO);
    setAvulsoName("");
    setPickService("");
    setPickProduct("");
    setPickQty("1");
    setPayment("dinheiro");
  };

  const handleCreateClient = async () => {
    if (!businessId || !newClient.name.trim()) return;
    setCreatingClient(true);
    const { data, error } = await supabase
      .from("clients")
      .insert({ business_id: businessId, name: newClient.name.trim(), phone: newClient.phone.trim() || null })
      .select("id, name, phone")
      .single();
    setCreatingClient(false);
    if (error) {
      toast({ title: "Erro ao cadastrar cliente", description: error.message, variant: "destructive" });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["clients", businessId] });
    setClientId(data.id);
    setNewClient({ name: "", phone: "" });
    setNewClientOpen(false);
    toast({ title: "Cliente cadastrado" });
  };

  const resolveClientId = async (): Promise<string> => {
    if (clientId !== AVULSO) return clientId;
    const nome = avulsoName.trim();
    if (nome) {
      const { data, error } = await supabase
        .from("clients")
        .insert({ business_id: businessId!, name: nome })
        .select("id").single();
      if (error) throw error;
      return data.id;
    }
    const { data: existing } = await supabase
      .from("clients").select("id")
      .eq("business_id", businessId!).eq("name", "Cliente Avulso").limit(1).maybeSingle();
    if (existing?.id) return existing.id;
    const { data, error } = await supabase
      .from("clients")
      .insert({ business_id: businessId!, name: "Cliente Avulso" })
      .select("id").single();
    if (error) throw error;
    return data.id;
  };

  const handleFinalizar = async () => {
    if (!businessId) return;
    if (!professionalId) {
      toast({ title: "Selecione o profissional", variant: "destructive" });
      return;
    }
    if (serviceItems.length === 0 && productItems.length === 0) {
      toast({ title: "Adicione pelo menos um serviço à comanda antes de finalizar.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const resolvedClientId = await resolveClientId();
      const now = new Date().toISOString();

      if (serviceItems.length > 0) {
        const { error } = await supabase.from("service_executions").insert(
          serviceItems.map((i) => ({
            business_id: businessId,
            professional_id: professionalId,
            client_id: resolvedClientId,
            service_id: i.service_id,
            appointment_id: null,
            performed_at: now,
            service_price_cents: i.price_cents,
          })),
        );
        if (error) throw error;
      }

      for (const i of productItems) {
        const { error } = await supabase.from("product_movements").insert({
          business_id: businessId,
          product_id: i.product_id,
          type: "sale",
          qty: i.qty,
          unit_price_cents: i.unit_price_cents,
          total_cents: i.qty * i.unit_price_cents,
          client_id: resolvedClientId,
          occurred_at: now,
        });
        if (error) throw error;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["products", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["product-movements", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["service-executions", businessId] }),
      ]);

      toast({
        title: "Atendimento finalizado!",
        description: `Valor registrado no financeiro: ${brl(total)}${payment ? ` (${payment})` : ""}`,
      });
      resetComanda();
    } catch (e: any) {
      toast({
        title: "Erro ao finalizar atendimento",
        description: e?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-semibold text-foreground">Atendimento Rápido</h1>
          <p className="text-sm text-muted-foreground">Balcão / ordem de chegada — monte a comanda e finalize.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente e profissional */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Cliente e profissional</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground">Cliente</Label>
                <div className="flex gap-2">
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AVULSO}>Cliente avulso (sem cadastro)</SelectItem>
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setNewClientOpen(true)} title="Cadastrar cliente">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
                {clientId === AVULSO && (
                  <Input
                    className="border-2"
                    placeholder="Nome (opcional, só para referência)"
                    value={avulsoName}
                    onChange={(e) => setAvulsoName(e.target.value)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Profissional *</Label>
                <Select value={professionalId} onValueChange={setProfessionalId}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Serviços */}
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Scissors className="h-4 w-4 text-primary" /> Serviços
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={pickService} onValueChange={setPickService}>
                <SelectTrigger className="border-2">
                  <SelectValue placeholder="Escolha um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {brl(s.price_cents)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addService}
                disabled={!pickService}
                className={cn(
                  "sm:w-auto transition-all duration-300",
                  pickService && "animate-pulse bg-primary/90 hover:bg-primary"
                )}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Selecione o serviço e clique em Adicionar para incluir na comanda.
            </p>
            {serviceItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço na comanda.</p>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {serviceItems.map((i) => (
                  <li key={i.key} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-sm text-foreground">{i.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{brl(i.price_cents)}</span>
                      <button
                        onClick={() => setServiceItems((prev) => prev.filter((x) => x.key !== i.key))}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover serviço"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Produtos */}
          {canProducts && (
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Package className="h-4 w-4 text-primary" /> Produtos (opcional)
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Adicione produtos apenas se o cliente for comprar algo. Não é obrigatório.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={pickProduct} onValueChange={setPickProduct}>
                  <SelectTrigger className="border-2">
                    <SelectValue placeholder="Escolha um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {brl(p.price_cents)} ({p.stock_qty} em estoque)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  value={pickQty}
                  onChange={(e) => setPickQty(e.target.value)}
                  className="border-2 sm:w-24"
                  aria-label="Quantidade"
                />
                <Button onClick={addProduct} disabled={!pickProduct} className="sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
              {productItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum produto na comanda.</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {productItems.map((i) => (
                    <li key={i.key} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm text-foreground">
                        {i.name} <span className="text-muted-foreground">x{i.qty}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm font-medium text-foreground">{brl(i.qty * i.unit_price_cents)}</span>
                        <button
                          onClick={() => setProductItems((prev) => prev.filter((x) => x.key !== i.key))}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remover produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* Resumo */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-primary/25 bg-card p-5 shadow-md space-y-4 lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold text-foreground">Resumo da comanda</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Serviços</span><span className="text-foreground">{brl(totalServicos)}</span>
              </div>
              {canProducts && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Produtos</span><span className="text-foreground">{brl(totalProdutos)}</span>
                </div>
              )}
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm font-medium text-foreground">Total</span>
              <span className="text-2xl font-semibold text-primary">{brl(total)}</span>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Forma de pagamento</Label>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleFinalizar}
              disabled={saving || (serviceItems.length === 0 && productItems.length === 0)}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Finalizar atendimento
            </Button>
            {serviceItems.length === 0 && productItems.length === 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Adicione um serviço para finalizar.
              </p>
            )}
            <Button variant="outline" className="w-full" onClick={resetComanda} disabled={saving}>
              Limpar comanda
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastro rápido de cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nome *</Label>
              <Input className="border-2" value={newClient.name}
                onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Telefone</Label>
              <Input className="border-2" value={newClient.phone}
                onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewClientOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateClient} disabled={creatingClient || !newClient.name.trim()}>
              {creatingClient && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AtendimentoRapido;
