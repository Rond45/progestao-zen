import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Check, Crown, Zap, Star, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PagamentoModal from "@/components/pagamento/PagamentoModal";
import { usePlansConfig } from "@/hooks/usePlansConfig";

const BASE_PLANS = [
  {
    id: "basico",
    name: "Básico",
    description: "Ideal para profissionais autônomos",
    icon: Star,
    baseFeatures: [
      "Agenda e agendamento",
      "Cadastro de clientes",
      "Serviços e preços",
      "Financeiro (caixa)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para equipes em crescimento",
    icon: Zap,
    popular: true,
    baseFeatures: [
      "Tudo do Básico",
      "WhatsApp IA",
      "Comissões automáticas",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Controle total do seu negócio",
    icon: Crown,
    baseFeatures: [
      "Tudo do Pro",
      "Produtos (estoque)",
      "Vendas e Consumo",
      "Relatórios avançados",
    ],
  },
] as const;

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  trialing: { label: "Em teste", variant: "secondary" },
  past_due: { label: "Pagamento pendente", variant: "destructive" },
  canceled: { label: "Cancelado", variant: "destructive" },
  incomplete: { label: "Incompleto", variant: "outline" },
};

const Planos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalPlan, setModalPlan] = useState<"basico" | "pro" | "premium" | null>(null);
  const autoCheckoutTriggered = useRef(false);
  const plansCfg = usePlansConfig();

  const PLANS = BASE_PLANS.map((p) => {
    const cfg = plansCfg[p.id as keyof typeof plansCfg];
    const profsLabel = cfg.profs === "ilimitado" ? "Profissionais ilimitados" : `Até ${cfg.profs} profissionais`;
    return { ...p, price: cfg.price, features: [...p.baseFeatures, profsLabel] };
  });

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("Assinatura realizada com sucesso!");
    } else if (status === "canceled") {
      toast.info("Checkout cancelado. Você pode assinar quando quiser.");
    }
  }, [searchParams]);

  // Auto-open payment modal when redirected from landing/login with ?plan=
  useEffect(() => {
    if (!user || loading || autoCheckoutTriggered.current) return;
    const planParam = searchParams.get("plan");
    if (!planParam) return;
    const plan = BASE_PLANS.find((p) => p.id === planParam);
    if (plan) {
      autoCheckoutTriggered.current = true;
      setSearchParams({}, { replace: true });
      setModalPlan(plan.id as any);
    }
  }, [user, loading, searchParams]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle();

      if (!error && data) {
        setSubscription(data);
      }
      setLoading(false);
    };
    fetchSubscription();
  }, [user]);

  const openPayment = (planId: string) => setModalPlan(planId as any);

  const currentPlan = subscription?.plan_name;
  const currentStatus = subscription?.status;
  const isActive = currentStatus === "active" || currentStatus === "trialing";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planos e Assinatura</h1>
        <p className="text-muted-foreground mt-1">Gerencie seu plano e faturamento.</p>
      </div>

      {/* Current subscription info */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : subscription && isActive ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">
                  Plano {currentPlan?.charAt(0).toUpperCase() + currentPlan?.slice(1)}
                </p>
                {statusLabels[currentStatus] && (
                  <Badge variant={statusLabels[currentStatus].variant}>{statusLabels[currentStatus].label}</Badge>
                )}
              </div>
            </div>
          </div>
          {subscription.acesso_valido_ate && (
            <p className="text-sm text-muted-foreground">
              Acesso válido até: {new Date(subscription.acesso_valido_ate).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      ) : subscription && currentStatus === "past_due" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Pagamento pendente</p>
              <p className="text-sm text-muted-foreground">Atualize seu método de pagamento para manter o acesso.</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = isActive && currentPlan === plan.id;
          const Icon = plan.icon;

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border p-6 flex flex-col transition-all duration-200 ${
                plan.popular
                  ? "border-primary/40 shadow-lg shadow-primary/5"
                  : "border-border/60 hover:border-primary/25"
              } ${isCurrent ? "ring-2 ring-primary/50" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Mais popular</Badge>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-foreground">R${plan.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Plano atual
                </Button>
              ) : (
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                  onClick={() => openPayment(plan.id)}
                >
                  {isActive ? "Trocar plano" : "Assinar"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {modalPlan && (
        <PagamentoModal
          open={!!modalPlan}
          onOpenChange={(v) => { if (!v) setModalPlan(null); }}
          plano={modalPlan}
        />
      )}
    </div>
  );
};

export default Planos;
