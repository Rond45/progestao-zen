import { useState } from "react";
import { DollarSign, TrendingUp, Wallet, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Financeiro = () => {
  const { businessId } = useBusiness();
  const [authenticated, setAuthenticated] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { data: financeAccess } = useQuery({
    queryKey: ["finance-access", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_access").select("*").eq("business_id", businessId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["service-executions-all", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_executions")
        .select("*, professionals(name, compensation_type, commission_percentage, salary_cents), services(name)")
        .eq("business_id", businessId!);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId && authenticated,
  });

  const { data: productSales = [] } = useQuery({
    queryKey: ["product-sales-all", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_movements")
        .select("*")
        .eq("business_id", businessId!)
        .eq("type", "sale");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId && authenticated,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeAccess) {
      setLoginError("Acesso financeiro nao configurado. Configure em Configuracoes.");
      return;
    }
    // Simple comparison (in production, use bcrypt via edge function)
    if (loginName === financeAccess.name && loginPassword === financeAccess.password_hash) {
      setAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Nome ou senha incorretos.");
    }
  };

  // If finance access exists but not authenticated
  if (financeAccess && !authenticated) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Acesso ao Financeiro</h2>
            <p className="text-sm text-muted-foreground mt-1">Digite o nome e a senha de acesso</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Nome</Label>
              <Input value={loginName} onChange={(e) => setLoginName(e.target.value)} className="bg-card border-border text-foreground" required />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Senha</Label>
              <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="bg-card border-border text-foreground" required />
            </div>
            {loginError && <p className="text-xs text-destructive">{loginError}</p>}
            <Button type="submit" variant="emerald" className="w-full">Acessar</Button>
          </form>
        </div>
      </div>
    );
  }

  // If no finance access configured, show data directly (or empty state)
  if (!financeAccess && !authenticated) {
    setAuthenticated(true);
  }

  const totalServicos = executions.reduce((s: number, e: any) => s + e.service_price_cents, 0);
  const totalProdutos = productSales.reduce((s: number, m: any) => s + (m.total_cents || 0), 0);
  const receitaTotal = totalServicos + totalProdutos;

  const totalComissoes = executions.reduce((s: number, e: any) => {
    const p = e.professionals;
    if (p?.compensation_type === "percentage") {
      return s + Math.round(e.service_price_cents * ((p.commission_percentage || 0) / 100));
    }
    return s;
  }, 0);

  const lucroLiquido = receitaTotal - totalComissoes;

  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  // Group by professional
  const profMap = new Map<string, { name: string; services: number; revenue: number; commission: number }>();
  executions.forEach((e: any) => {
    const pName = e.professionals?.name || "Desconhecido";
    const existing = profMap.get(pName) || { name: pName, services: 0, revenue: 0, commission: 0 };
    existing.services++;
    existing.revenue += e.service_price_cents;
    if (e.professionals?.compensation_type === "percentage") {
      existing.commission += Math.round(e.service_price_cents * ((e.professionals.commission_percentage || 0) / 100));
    }
    profMap.set(pName, existing);
  });
  const commissions = Array.from(profMap.values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo financeiro baseado em dados reais</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-muted-foreground mb-3" />
          <p className="text-2xl font-bold text-foreground">{formatPrice(receitaTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">Receita total</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Wallet className="h-4 w-4 text-muted-foreground mb-3" />
          <p className="text-2xl font-bold text-foreground">{formatPrice(totalComissoes)}</p>
          <p className="text-xs text-muted-foreground mt-1">Comissoes pagas</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <TrendingUp className="h-4 w-4 text-muted-foreground mb-3" />
          <p className="text-2xl font-bold text-foreground">{formatPrice(lucroLiquido)}</p>
          <p className="text-xs text-muted-foreground mt-1">Lucro liquido</p>
        </div>
      </div>

      {commissions.length === 0 && productSales.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum dado financeiro disponivel ainda. Complete agendamentos para gerar relatorios.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">Receita por fonte</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">Servicos</span>
                  <span className="text-sm font-medium text-foreground">{formatPrice(totalServicos)}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: receitaTotal > 0 ? `${(totalServicos / receitaTotal) * 100}%` : "0%" }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">Produtos</span>
                  <span className="text-sm font-medium text-foreground">{formatPrice(totalProdutos)}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: receitaTotal > 0 ? `${(totalProdutos / receitaTotal) * 100}%` : "0%" }} />
                </div>
              </div>
            </div>
          </div>

          {commissions.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground mb-4">Comissoes por profissional</h3>
              <div className="space-y-3">
                {commissions.map((c) => (
                  <div key={c.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-semibold text-muted-foreground">{c.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.services} atendimentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary">{formatPrice(c.commission)}</p>
                      <p className="text-[10px] text-muted-foreground">de {formatPrice(c.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Financeiro;
