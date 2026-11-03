import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, LogOut, Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import PagamentoModal from "./PagamentoModal";
import { usePlansConfig } from "@/hooks/usePlansConfig";
import { PLAN_LABEL, type PlanName } from "@/lib/planAccess";

const PAID_PLANS: PlanName[] = ["basico", "pro", "premium"];

export default function VencimentoGate() {
  const { vencido, acessoValidoAte, currentPlanName, planName, isTrialing, loading } = usePlan();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const plansConfig = usePlansConfig();
  const [paymentPlan, setPaymentPlan] = useState<PlanName | null>(null);

  const daysLeft = useMemo(() => {
    if (!acessoValidoAte) return null;
    const ms = acessoValidoAte.getTime() - Date.now();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }, [acessoValidoAte]);

  // Só abre modal de pagamento com plano realmente pago. Trial/free ("free") vira null.
  const planoValido = useMemo<PlanName | null>(() => {
    const candidate = (currentPlanName ?? planName) as PlanName | null;
    return candidate && PAID_PLANS.includes(candidate) ? candidate : null;
  }, [currentPlanName, planName]);

  if (loading) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Preventive banner (3 days or less, still active, not trialing)
  const showBanner =
    !vencido && !isTrialing && acessoValidoAte && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

  const showTrialBanner = isTrialing && daysLeft !== null && daysLeft >= 0;

  const handleRenovate = () => {
    if (planoValido) {
      setPaymentPlan(planoValido);
    } else {
      navigate("/dashboard/planos");
    }
  };

  return (
    <>
      {showTrialBanner && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-primary/40 bg-primary/10 px-4 py-3 shadow-sm">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-foreground">
              Teste grátis: {daysLeft === 0 ? "último dia" : `faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Você tem acesso completo ao Premium. Escolha seu plano para continuar sem interrupções.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/dashboard/planos">Escolher plano</Link>
          </Button>
        </div>
      )}

      {showBanner && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border-2 border-primary/40 bg-primary/10 px-4 py-3 shadow-sm">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <div className="flex-1 min-w-[200px]">
            <p className="text-sm font-semibold text-foreground">
              {daysLeft === 0
                ? "Seu acesso vence hoje"
                : `Seu acesso vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Válido até {acessoValidoAte!.toLocaleDateString("pt-BR")}. Renove para continuar sem interrupções.
            </p>
          </div>
          <Button size="sm" onClick={handleRenovate}>
            Renovar
          </Button>
        </div>
      )}

      <Dialog open={vencido} onOpenChange={() => { /* not dismissible */ }}>
        <DialogContent
          className="max-w-md border-primary/40 shadow-[0_20px_60px_-10px_rgba(184,143,60,0.45)]"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto rounded-full bg-primary/15 p-3 mb-2">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            {planoValido ? (
              <>
                <DialogTitle className="text-center text-xl">Seu acesso expirou</DialogTitle>
                <DialogDescription className="text-center">
                  Para continuar aproveitando o ProGestão+, renove sua assinatura. É rápido e você volta de onde parou.
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-center text-xl">Seu teste grátis terminou</DialogTitle>
                <DialogDescription className="text-center">
                  Escolha o plano que cabe no seu negócio para continuar de onde parou.
                </DialogDescription>
              </>
            )}
          </DialogHeader>

          {planoValido ? (
            <div className="flex flex-col gap-2 pt-2">
              <Button size="lg" onClick={() => setPaymentPlan(planoValido)}>
                Renovar agora
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              {PAID_PLANS.map((p) => (
                <Button
                  key={p}
                  size="lg"
                  variant={p === "pro" ? "default" : "outline"}
                  className="justify-between gap-3"
                  onClick={() => setPaymentPlan(p)}
                >
                  <span>
                    {PLAN_LABEL[p]} — R${plansConfig[p].price}/mês
                  </span>
                  {p === "pro" && (
                    <span className="rounded-full bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                      Mais popular
                    </span>
                  )}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" /> Sair
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {paymentPlan && (
        <PagamentoModal
          open={!!paymentPlan}
          onOpenChange={(v) => { if (!v) setPaymentPlan(null); }}
          plano={paymentPlan}
          dismissible={!vencido}
        />
      )}
    </>
  );
}
