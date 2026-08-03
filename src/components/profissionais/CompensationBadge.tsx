import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Compensation = {
  compensation_type: string | null;
  commission_percentage: number | null;
  salary_cents: number | null;
};

export const compensationQuery = (professionalId: string) => ({
  queryKey: ["professional-compensation", professionalId],
  queryFn: async (): Promise<Compensation | null> => {
    const { data, error } = await supabase.rpc("get_professional_compensation", {
      _professional_id: professionalId,
    });
    if (error) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as Compensation) ?? null;
  },
  staleTime: 5 * 60 * 1000,
});

export const formatCompensation = (c: Compensation | null | undefined) => {
  if (!c) return "—";
  if (c.compensation_type === "salary") {
    if (c.salary_cents == null) return "—";
    return `Salario R$ ${(c.salary_cents / 100).toFixed(2).replace(".", ",")}`;
  }
  if (c.commission_percentage == null) return "—";
  return `Comissao ${c.commission_percentage}%`;
};

const CompensationBadge = ({ professionalId }: { professionalId: string }) => {
  const { data, isLoading } = useQuery(compensationQuery(professionalId));
  return (
    <span className="text-[10px] text-muted-foreground">
      {isLoading ? "..." : formatCompensation(data)}
    </span>
  );
};

export default CompensationBadge;
