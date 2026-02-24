import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Crown, Zap, Star, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PLANS = [
  {
    id: "basico",
    name: "Básico",
    price: "39",
    priceId: import.meta.env.VITE_STRIPE_PRICE_BASICO ?? "",
    description: "Ideal para profissionais autônomos",
    icon: Star,
    features: [
      "1 profissional",
      "Agenda completa",
      "Cadastro de clientes",
      "Financeiro básico",
      "50 agendamentos/mês",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "89",
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO ?? "",
    description: "Para equipes em crescimento",
    icon: Zap,
    popular: true,
    features: [
      "Até 3 profissionais",
      "WhatsApp IA",
      "CRM completo",
      "Comissões automáticas",
      "200 agendamentos/mês",
      "Política antifuro",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "169",
    priceId: import.meta.env.VITE_STRIPE_PRICE_PREMIUM ?? "",
    description: "Controle total do seu negócio",
    icon: Crown,
    features: [
      "Até 6 profissionais",
      "WhatsApp IA ilimitado",
      "Relatórios avançados",
      "Múltiplas automações",
      "Agendamentos ilimitados",
      "Suporte prioritário",
    ],
  },
];

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativo", variant: "default" },
  trialing: { label: "Em teste", variant: "secondary" },
  past_due: { label: "Pagamento pendente", variant: "destructive" },
  canceled: { label: "Cancelado", variant: "destructive" },
  incomplete: { label: "Incompleto", variant: "outline" },
};

const Planos = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("Assinatura realizada com sucesso!");
    } else if (status === "canceled") {
      toast.info("Checkout cancelado. Você pode assinar quando quiser.");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSubscription(data);
      }
      setLoading(false);
    };
    fetchSubscription();
  }, [user]);

  const handleCheckout = async (priceId: string, planName: string) => {
    if (!priceId) {
      toast.error("Price ID não configurado. Configure as variáveis de ambiente VITE_STRIPE_PRICE_*.");
      return;
    }
    setCheckoutLoading(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, planName },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao iniciar checkout: " + (err.message || "Tente novamente."));
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao abrir portal: " + (err.message || "Tente novamente."));
    } finally {
      setPortalLoading(false);
    }
  };

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
                  <Badge variant={statusLabels[currentStatus].variant}>
                    {statusLabels[currentStatus].label}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Gerenciar assinatura
            </Button>
          </div>
          {subscription.current_period_end && (
            <p className="text-sm text-muted-foreground">
              Próxima renovação: {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
      ) : subscription && currentStatus === "past_due" ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-foreground">Pagamento pendente</p>
              <p className="text-sm text-muted-foreground">
                Atualize seu método de pagamento para manter o acesso.
              </p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="mt-4" onClick={handlePortal} disabled={portalLoading}>
            {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Atualizar pagamento
          </Button>
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
                  disabled={!!checkoutLoading}
                  onClick={() => handleCheckout(plan.priceId, plan.id)}
                >
                  {checkoutLoading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {isActive ? "Trocar plano" : "Assinar"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Planos;
