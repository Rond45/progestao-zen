import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const stats = [
  {
    label: "Agendamentos hoje",
    value: "12",
    change: "+3",
    up: true,
    icon: Calendar,
  },
  {
    label: "Clientes ativos",
    value: "248",
    change: "+18",
    up: true,
    icon: Users,
  },
  {
    label: "Receita do mes",
    value: "R$ 8.450",
    change: "+12%",
    up: true,
    icon: DollarSign,
  },
  {
    label: "Taxa de faltas",
    value: "4,2%",
    change: "-1,8%",
    up: false,
    icon: AlertTriangle,
  },
];

const todayAppointments = [
  { time: "09:00", client: "Carlos Silva", service: "Corte + Barba", professional: "Joao", status: "Confirmado" },
  { time: "09:45", client: "Pedro Santos", service: "Corte", professional: "Joao", status: "Marcado" },
  { time: "10:00", client: "Andre Lima", service: "Barba", professional: "Rafael", status: "Em atendimento" },
  { time: "10:30", client: "Lucas Oliveira", service: "Corte", professional: "Joao", status: "Marcado" },
  { time: "11:00", client: "Marcos Costa", service: "Sobrancelha", professional: "Rafael", status: "Confirmado" },
];

const statusColors: Record<string, string> = {
  "Confirmado": "text-emerald-400",
  "Marcado": "text-muted-foreground",
  "Em atendimento": "text-primary",
  "Concluido": "text-emerald-400",
  "Faltou": "text-red-400",
};

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-sm text-muted-foreground mt-1">Visao geral do seu negocio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${stat.up ? "text-emerald-400" : "text-primary"}`}>
                {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">Agenda de hoje</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Quarta-feira, 19 de fevereiro</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {todayAppointments.length} agendamentos
          </div>
        </div>
        <div className="divide-y divide-border">
          {todayAppointments.map((apt, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors">
              <span className="text-sm font-medium text-foreground w-12">{apt.time}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{apt.client}</p>
                <p className="text-xs text-muted-foreground">{apt.service}</p>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">{apt.professional}</span>
              <span className={`text-xs font-medium ${statusColors[apt.status] || "text-muted-foreground"}`}>
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Servicos mais populares</h3>
          <div className="space-y-3">
            {[
              { name: "Corte + Barba", count: 45, pct: 100 },
              { name: "Corte", count: 38, pct: 84 },
              { name: "Barba", count: 22, pct: 49 },
              { name: "Sobrancelha", count: 12, pct: 27 },
            ].map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{s.name}</span>
                  <span className="text-xs text-muted-foreground">{s.count}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">Profissionais hoje</h3>
          <div className="space-y-3">
            {[
              { name: "Joao", appointments: 6, revenue: "R$ 420" },
              { name: "Rafael", appointments: 4, revenue: "R$ 280" },
              { name: "Lucas", appointments: 2, revenue: "R$ 140" },
            ].map((p) => (
              <div key={p.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-semibold text-muted-foreground">{p.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.appointments} atendimentos</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground">{p.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
