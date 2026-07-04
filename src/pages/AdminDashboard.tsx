import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, MessageSquare, LogOut, Megaphone, Image, CreditCard, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminClients from "@/components/admin/AdminClients";
import AdminWhatsApp from "@/components/admin/AdminWhatsApp";
import AdminAnuncios from "@/components/admin/AdminAnuncios";
import AdminAssinaturas from "@/components/admin/AdminAssinaturas";
import AdminAvisos from "@/components/admin/AdminAvisos";
import AdminPlanos from "@/components/admin/AdminPlanos";

const tabs = [
  { id: "overview", label: "Visão Geral", icon: BarChart3 },
  { id: "clients", label: "Clientes", icon: Users },
  { id: "whatsapp", label: "WhatsApp IA", icon: MessageSquare },
  { id: "anuncios", label: "Anúncios", icon: Image },
  { id: "assinaturas", label: "Assinaturas", icon: CreditCard },
  { id: "avisos", label: "Avisos", icon: Megaphone },
  { id: "planos", label: "Planos", icon: Package },
] as const;

type TabId = (typeof tabs)[number]["id"];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  return (
    <div className="admin-scope min-h-screen bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100 tracking-wide">PGZ Admin</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                activeTab === t.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-zinc-800">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-zinc-400 hover:text-red-400"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === "overview" && <AdminOverview />}
        {activeTab === "clients" && <AdminClients />}
        {activeTab === "whatsapp" && <AdminWhatsApp />}
        {activeTab === "anuncios" && <AdminAnuncios />}
        {activeTab === "assinaturas" && <AdminAssinaturas />}
        {activeTab === "avisos" && <AdminAvisos />}
        {activeTab === "planos" && <AdminPlanos />}
      </main>
    </div>
  );
};

export default AdminDashboard;
