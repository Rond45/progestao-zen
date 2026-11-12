import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Clock, LogOut, Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import PagamentoModal from "./PagamentoModal";
import { usePlansConfig } from "@/hooks/usePlansConfig";
import { PLAN_LABEL, type PlanName } from "@/lib/planAccess";

const PAID_PLANS: PlanName[] = ["basico", "pro", "premium"];

// Dia de calendário (YYYY-MM-DD) no fuso de Brasília
const diaBrasilia = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const diasCalendario = (alvo: Date) => {
  const a = Date.parse(diaBrasilia(alvo) + "T00:00:00Z");
  const b = Date.parse(diaBrasilia(new Date()) + "T00:00:00Z");
  return Math.round((a - b) / 86_400_000);
};

export default function VencimentoGate() {
  const { vencido, acessoValidoAte, currentPlanName, planName, isTrialing, loading, metodoPagamento, status } = usePlan();
  const { signOut, user } = useAuth();
  const [showThanks, setShowThanks] = useState(false);
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

  // Agradecimento a cada pagamento: acesso_valido_ate maior que o último visto neste navegador
  const acessoMs = acessoValidoAte ? acessoValidoAte.getTime() : null;
  useEffect(() => {
    if (!user || status !== "active" || acessoMs === null) return;
    const key = `progestao_ultimo_acesso_${user.id}`;
    try {
      const saved = localStorage.getItem(key);
      localStorage.setItem(key, String(acessoMs));
      if (saved !== null && acessoMs > Number(saved)) setShowThanks(true);
    } catch { /* ignore */ }
  }, [user, status, acessoMs]);

  if (loading) return null;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Aviso de renovação manual (Pix): véspera e dia do vencimento, por dia de calendário em Brasília
  const diasBr = acessoValidoAte ? diasCalendario(acessoValidoAte) : null;
  const showBanner =
    !vencido && !isTrialing && !!planoValido && metodoPagamento === "pix" && diasBr !== null && diasBr >= 0 && diasBr <= 1;

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
              {diasBr === 0 ? "Seu plano vence hoje" : "Seu plano vence amanhã"}
            </p>
            <p className="text-xs text-muted-foreground">
              Que bom que você está gostando do ProGestão+ e que podemos contribuir com o seu crescimento. Não esqueça de
              manter o seu plano ativo. Que Deus te abençoe e te prospere!
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
                <DialogTitle className="text-center text-xl">Seu plano venceu</DialogTitle>
                <DialogDescription className="text-center">
                  Para continuar de onde parou, renove o seu plano. Que Deus te abençoe e te prospere!
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="text-center text-xl">Gostou do ProGestão+?</DialogTitle>
                <DialogDescription className="text-center">
                  Acreditamos que ele vai te ajudar muito. Que tal verificar o melhor plano para você?
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

      <Dialog open={showThanks && !vencido} onOpenChange={setShowThanks}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto rounded-full bg-primary/15 p-3 mb-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">Pagamento confirmado!</DialogTitle>
            <DialogDescription className="text-center">
              Obrigado por confiar no ProGestão+ e por fazer parte da nossa história. Que Deus te abençoe e te prospere neste mês!
            </DialogDescription>
          </DialogHeader>
          <Button size="lg" onClick={() => setShowThanks(false)}>Continuar</Button>
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
