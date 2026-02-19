import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  ArrowUpRight,
} from "lucide-react";

const paymentMethods = [
  { method: "Pix", amount: "R$ 3.240", pct: 45 },
  { method: "Cartao de credito", amount: "R$ 2.180", pct: 30 },
  { method: "Cartao de debito", amount: "R$ 1.120", pct: 15 },
  { method: "Dinheiro", amount: "R$ 720", pct: 10 },
];

const commissions = [
  { name: "Joao", services: 45, revenue: "R$ 3.150", commission: "R$ 1.260" },
  { name: "Rafael", services: 32, revenue: "R$ 2.240", commission: "R$ 896" },
  { name: "Lucas", services: 20, revenue: "R$ 1.400", commission: "R$ 560" },
];

const Financeiro = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground mt-1">Resumo financeiro do mes</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
              <ArrowUpRight className="h-3 w-3" />
              +12%
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">R$ 8.450</p>
          <p className="text-xs text-muted-foreground mt-1">Receita total</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">R$ 2.716</p>
          <p className="text-xs text-muted-foreground mt-1">Comissoes pagas</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">R$ 5.734</p>
          <p className="text-xs text-muted-foreground mt-1">Lucro liquido</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment methods */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Formas de pagamento</h3>
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <div key={pm.method}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{pm.method}</span>
                  <span className="text-sm font-medium text-foreground">{pm.amount}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${pm.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commissions */}
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
                  <p className="text-sm font-medium text-primary">{c.commission}</p>
                  <p className="text-[10px] text-muted-foreground">de {c.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Financeiro;
