import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { PLAN_LEVEL, type PlanName } from "@/lib/planAccess";

export const usePlan = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_name, status, metodo_pagamento, acesso_valido_ate")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const acessoValidoAte = (data as any)?.acesso_valido_ate
    ? new Date((data as any).acesso_valido_ate as string)
    : null;
  const metodoPagamento = ((data as any)?.metodo_pagamento as string | null) ?? null;

  const now = new Date();
  const dateOk = acessoValidoAte ? acessoValidoAte.getTime() > now.getTime() : true;
  const statusOk =
    !!data && (data.status === "active" || data.status === "trialing");
  const isActive = statusOk && dateOk;
  const vencido = !!acessoValidoAte && acessoValidoAte.getTime() <= now.getTime();

  const isTrialing = !!data && data.status === "trialing" && dateOk;
  // Trial gives full Premium access
  const planName: PlanName = isTrialing
    ? "premium"
    : isActive
      ? ((data!.plan_name as PlanName) ?? "basico")
      : "basico";

  const hasAccess = (minPlan: PlanName) =>
    PLAN_LEVEL[planName] >= PLAN_LEVEL[minPlan];

  return {
    planName,
    currentPlanName: (data?.plan_name as PlanName | null) ?? null,
    isActive,
    isTrialing,
    vencido,
    acessoValidoAte,
    metodoPagamento,
    status: (data?.status as string | null) ?? null,
    loading: isLoading,
    hasAccess,
  };
};