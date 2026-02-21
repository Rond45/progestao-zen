import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Scissors, MessageSquare,
  DollarSign, Settings, Menu, X, LogOut, UserRound, Package, ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Painel", end: true },
  { to: "/dashboard/agenda", icon: Calendar, label: "Agenda" },
  { to: "/dashboard/clientes", icon: Users, label: "Clientes" },
  { to: "/dashboard/profissionais", icon: UserRound, label: "Profissionais" },
  { to: "/dashboard/servicos", icon: Scissors, label: "Servicos" },
  { to: "/dashboard/produtos", icon: Package, label: "Produtos" },
  { to: "/dashboard/vendas", icon: ShoppingCart, label: "Vendas e Consumo" },
  { to: "/dashboard/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/dashboard/whatsapp", icon: MessageSquare, label: "WhatsApp IA" },
  { to: "/dashboard/configuracoes", icon: Settings, label: "Configuracoes" },
];

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, business } = useBusiness();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const isSalon = business?.vertical === "salao";

  return (
    <div className={`min-h-screen bg-background flex ${isSalon ? "salon-theme" : ""}`}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-sidebar-primary" />
            <span className="text-base font-bold text-foreground tracking-tight">
              ProGestao<span className="text-sidebar-primary">+</span>
            </span>
          </div>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-sidebar-accent text-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">
                {(profile?.name || "U")[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{profile?.role || ""}</p>
            </div>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <h2 className="text-sm font-medium text-muted-foreground">{business?.name || "Meu Negocio"}</h2>
          </div>
          <div />
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
