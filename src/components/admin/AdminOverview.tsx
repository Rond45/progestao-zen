import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Wifi, CalendarPlus, PieChart } from "lucide-react";

export const adminCall = async (action: string, params: Record<string, any> = {}) => {
  const session = JSON.parse(sessionStorage.getItem("pgz_admin_session") || "{}");
  const { data, error } = await supabase.functions.invoke("admin-api", {
    body: {
      action,
      admin_email: session.email || "",
      admin_password: session.password || "",
      ...params,
    },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
};

const AdminOverview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => adminCall("get-overview"),
  });

  const cards = [
    { label: "Total de estabelecimentos", value: data?.total ?? "—", icon: Building2, color: "text-blue-400" },
    { label: "WhatsApp ativo", value: data?.whatsapp_active ?? "—", icon: Wifi, color: "text-emerald-400" },
    { label: "Novos este mês", value: data?.new_this_month ?? "—", icon: CalendarPlus, color: "text-amber-400" },
    {
      label: "Distribuição",
      value: data ? `${data.barbearias ?? 0} barb. / ${data.saloes ?? 0} salão` : "—",
      icon: PieChart,
      color: "text-purple-400",
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-100 mb-6">Visão Geral</h1>
      {isLoading ? (
        <p className="text-zinc-400 text-sm">Carregando...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <c.icon className={`h-4 w-4 ${c.color}`} />
                <span className="text-xs text-zinc-400">{c.label}</span>
              </div>
              <p className="text-2xl font-bold text-zinc-100">{c.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
