import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Users, Calendar } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const ProfissionalDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { businessId } = useBusiness();

  const { data: professional } = useQuery({
    queryKey: ["professional", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: executions = [], isLoading } = useQuery({
    queryKey: ["service-executions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_executions")
        .select("*, clients(name), services(name)")
        .eq("professional_id", id!)
        .eq("business_id", businessId!)
        .order("performed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!businessId,
  });

  const totalBruto = executions.reduce((s: number, e: any) => s + e.service_price_cents, 0);
  const uniqueClients = new Set(executions.map((e: any) => e.client_id)).size;

  const calcLiquido = () => {
    if (!professional) return 0;
    if (professional.compensation_type === "percentage") {
      return Math.round(totalBruto * ((professional.commission_percentage || 0) / 100));
    }
    return professional.salary_cents || 0;
  };

  const liquido = calcLiquido();
  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  if (!professional) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <button onClick={() => navigate("/dashboard/profissionais")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-foreground">{professional.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {professional.specialty || "Geral"} — {professional.compensation_type === "percentage" ? `Comissao ${professional.commission_percentage}%` : `Salario ${formatPrice(professional.salary_cents || 0)}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <Calendar className="h-4 w-4 text-muted-foreground mb-3" />
          <p className="text-2xl font-bold text-foreground">{executions.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Servicos realizados</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Users className="h-4 w-4 text-muted-foreground mb-3" />
          <p className="text-2xl font-bold text-foreground">{uniqueClients}</p>
          <p className="text-xs text-muted-foreground mt-1">Clientes atendidos</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <DollarSign className="h-4 w-4 text-muted-foreground mb-3" />
          <p className="text-2xl font-bold text-foreground">{formatPrice(totalBruto)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total bruto</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            {professional.compensation_type === "percentage" ? "Comissão líquida" : "Salário mensal"}
          </h3>
          <span className="text-lg font-bold text-primary">{formatPrice(liquido)}</span>
        </div>
        {professional.compensation_type === "salary" && (
          <p className="text-xs text-muted-foreground">Modelo de salário fixo. O valor bruto dos serviços não afeta a remuneração.</p>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : executions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhum serviço realizado ainda.</div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Data</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Cliente</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Serviço</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {executions.map((e: any) => (
                  <tr key={e.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">{format(new Date(e.performed_at), "dd/MM/yyyy HH:mm")}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{e.clients?.name || "-"}</td>
                    <td className="px-5 py-3.5 text-sm text-foreground">{e.services?.name || "-"}</td>
                    <td className="px-5 py-3.5 text-right text-sm font-medium text-primary">{formatPrice(e.service_price_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfissionalDetalhe;
