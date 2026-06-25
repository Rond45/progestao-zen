import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";
import {
  PLAN_LABEL,
  FEATURE_COPY,
  type PlanName,
} from "@/lib/planAccess";

interface PlanGateProps {
  minPlan: PlanName;
  featureKey?: keyof typeof FEATURE_COPY;
  children: ReactNode;
}

const PlanGate = ({ minPlan, featureKey, children }: PlanGateProps) => {
  const { hasAccess, loading } = usePlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (hasAccess(minPlan)) return <>{children}</>;

  const copy = featureKey ? FEATURE_COPY[featureKey] : null;
  const title = copy?.title ?? "Recurso";
  const description =
    copy?.description ??
    "Faça upgrade do seu plano para desbloquear este recurso.";

  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-full max-w-lg rounded-2xl border border-primary/30 bg-card p-8 shadow-lg text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-5 border border-primary/30 shadow-sm">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
          {title} — disponível no plano {PLAN_LABEL[minPlan]}
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {description}
        </p>
        <Button
          asChild
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
        >
          <Link to="/dashboard/planos">Fazer upgrade</Link>
        </Button>
      </div>
    </div>
  );
};

export default PlanGate;