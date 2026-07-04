import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlansConfig = {
  basico: { price: string; profs: string };
  pro: { price: string; profs: string };
  premium: { price: string; profs: string };
};

const DEFAULTS: PlansConfig = {
  basico: { price: "39", profs: "2" },
  pro: { price: "79", profs: "4" },
  premium: { price: "149", profs: "ilimitado" },
};

export const usePlansConfig = () => {
  const { data } = useQuery({
    queryKey: ["public-plans-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("platform_config")
        .select("key, value")
        .like("key", "plan_%");
      const cfg: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { cfg[r.key] = r.value; });
      const profDisplay = (v?: string) => {
        if (!v) return null;
        const n = parseInt(v, 10);
        if (!Number.isFinite(n)) return v;
        return n >= 999 ? "ilimitado" : String(n);
      };
      const merged: PlansConfig = {
        basico: {
          price: cfg.plan_basico_price || DEFAULTS.basico.price,
          profs: profDisplay(cfg.plan_basico_prof) || DEFAULTS.basico.profs,
        },
        pro: {
          price: cfg.plan_pro_price || DEFAULTS.pro.price,
          profs: profDisplay(cfg.plan_pro_prof) || DEFAULTS.pro.profs,
        },
        premium: {
          price: cfg.plan_premium_price || DEFAULTS.premium.price,
          profs: profDisplay(cfg.plan_premium_prof) || DEFAULTS.premium.profs,
        },
      };
      return merged;
    },
    staleTime: 60_000,
  });

  return data ?? DEFAULTS;
};