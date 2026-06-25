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
        .select("plan_name, status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isActive =
    !!data && (data.status === "active" || data.status === "trialing");

  const planName: PlanName = isActive
    ? ((data!.plan_name as PlanName) ?? "basico")
    : "basico";

  const hasAccess = (minPlan: PlanName) =>
    PLAN_LEVEL[planName] >= PLAN_LEVEL[minPlan];

  return { planName, isActive, loading: isLoading, hasAccess };
};