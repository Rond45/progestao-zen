import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import BoasVindasBarbearia from "./pages/BoasVindasBarbearia";
import BoasVindasSalao from "./pages/BoasVindasSalao";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import Agenda from "./pages/Agenda";
import Clientes from "./pages/Clientes";
import Profissionais from "./pages/Profissionais";
import ProfissionalDetalhe from "./pages/ProfissionalDetalhe";
import Servicos from "./pages/Servicos";
import Produtos from "./pages/Produtos";
import VendasConsumo from "./pages/VendasConsumo";
import Financeiro from "./pages/Financeiro";
import WhatsAppIA from "./pages/WhatsAppIA";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import Suporte from "./pages/Suporte";
import Planos from "./pages/Planos";
import PlanosPublico from "./pages/PlanosPublico";
import ClienteDetalhe from "./pages/ClienteDetalhe";
import { useVerticalTheme } from "@/hooks/useVerticalTheme";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
    // Aplica o tema (cores) baseado na vertical salva no navegador.
    // Assim, o usuário entra no dashboard já com o tema correto.
    useVerticalTheme();

    return (
          <QueryClientProvider client={queryClient}>
                  <AuthProvider>
                          <TooltipProvider>
                                    <Toaster />
                                    <Sonner />
                                    <BrowserRouter>
                                                <Routes>
                                                              <Route path="/" element={<Landing />} />
                                                              <Route path="/login" element={<Login />} />
                                                              <Route path="/registro" element={<Navigate to="/login" replace />} />
                                                
                                                  {/* Páginas institucionais */}
                                                              <Route path="/termos" element={<Termos />} />
                                                              <Route path="/privacidade" element={<Privacidade />} />
                                                              <Route path="/suporte" element={<Suporte />} />
                                                              <Route path="/planos" element={<PlanosPublico />} />
                                                
                                                  {/* Escolha de ambiente */}
                                                              <Route path="/barbearia/boas-vindas" element={<BoasVindasBarbearia />} />
                                                              <Route path="/salao/boas-vindas" element={<BoasVindasSalao />} />
                                                
                                                  {/* App (área logada) */}
                                                              <Route
                                                                                path="/dashboard"
                                                                                element={
                                                                                                    <ProtectedRoute>
                                                                                                                        <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="agenda" element={<Agenda />} />
                  <Route path="clientes" element={<Clientes />} />
                  <Route path="clientes/:id" element={<ClienteDetalhe />} />
                  <Route path="profissionais" element={<Profissionais />} />
                  <Route path="profissionais/:id" element={<ProfissionalDetalhe />} />
                  <Route path="servicos" element={<Servicos />} />
                  <Route path="produtos" element={<Produtos />} />
                  <Route path="vendas" element={<VendasConsumo />} />
                  <Route path="financeiro" element={<Financeiro />} />
                  <Route path="whatsapp" element={<WhatsAppIA />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  <Route path="planos" element={<Planos />} />
                </Route>

                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
};

export default App;
