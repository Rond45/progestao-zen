import { Calendar, Users, DollarSign, Clock, Scissors as ScissorsIcon } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  done: "Concluido",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  scheduled: "text-muted-foreground",
  confirmed: "text-primary",
  done: "text-primary",
  cancelled: "text-destructive",
};

const DashboardHome = () => {
  const { businessId, business } = useBusiness();
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ["today-appointments", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(name), professionals(name), services(name)")
        .eq("business_id", businessId!)
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .neq("status", "cancelled")
        .order("starts_at");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["client-count", businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!businessId,
  });

  const { data: professionalCount = 0 } = useQuery({
    queryKey: ["professional-count", businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("professionals")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId!)
        .eq("active", true);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!businessId,
  });

  const { data: serviceCount = 0 } = useQuery({
    queryKey: ["service-count", businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("business_id", businessId!)
        .eq("active", true);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!businessId,
  });

  const stats = [
    { label: "Agendamentos hoje", value: String(todayAppointments.length), icon: Calendar },
    { label: "Clientes cadastrados", value: String(clientCount), icon: Users },
    { label: "Profissionais ativos", value: String(professionalCount), icon: Users },
    { label: "Servicos ativos", value: String(serviceCount), icon: ScissorsIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {business?.name || "Seu negocio"} - Visao geral
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">Agenda de hoje</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {todayAppointments.length} agendamentos
          </div>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum agendamento para hoje.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayAppointments.map((apt: any) => (
              <div key={apt.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                <span className="text-sm font-medium text-foreground w-12">
                  {format(new Date(apt.starts_at), "HH:mm")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{apt.clients?.name}</p>
                  <p className="text-xs text-muted-foreground">{apt.services?.name}</p>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{apt.professionals?.name}</span>
                <span className={`text-xs font-medium ${statusColors[apt.status] || "text-muted-foreground"}`}>
                  {statusLabels[apt.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
