import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Basico",
    price: "39",
    description: "Para profissionais autonomos",
    current: false,
    features: [
      "1 profissional",
      "50 agendamentos por mes",
      "Cadastro de clientes",
      "Financeiro basico",
      "Sem automacao WhatsApp",
    ],
  },
  {
    name: "Pro",
    price: "89",
    description: "Para equipes em crescimento",
    current: true,
    features: [
      "Ate 3 profissionais",
      "200 agendamentos por mes",
      "WhatsApp IA",
      "CRM completo",
      "Comissoes automaticas",
      "Politica antifuro",
    ],
  },
  {
    name: "Premium",
    price: "169",
    description: "Controle total do negocio",
    current: false,
    features: [
      "Ate 6 profissionais",
      "Agendamentos ilimitados",
      "WhatsApp IA ilimitado",
      "Relatorios avancados",
      "Multiplas automacoes",
      "Suporte prioritario",
    ],
  },
];

const Planos = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minha assinatura</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu plano e cobranca</p>
      </div>

      {/* Current plan */}
      <div className="rounded-lg border border-primary/30 bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-foreground">Plano Pro</h3>
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Ativo</span>
            </div>
            <p className="text-sm text-muted-foreground">Proxima cobranca em 15/03/2026</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-foreground">R$89<span className="text-sm text-muted-foreground font-normal">/mes</span></p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-lg border p-5 flex flex-col ${
              plan.current ? "border-primary/30 bg-card" : "border-border bg-card"
            }`}
          >
            <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
            <div className="mb-5">
              <span className="text-3xl font-bold text-foreground">R${plan.price}</span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {plan.current ? (
              <Button variant="outline" className="w-full" disabled>
                Plano atual
              </Button>
            ) : (
              <Button variant="outline" className="w-full">
                {parseInt(plan.price) > 89 ? "Fazer upgrade" : "Fazer downgrade"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Planos;
