import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Star, Shield, Calendar } from "lucide-react";
import heroSalon from "@/assets/hero-salon.jpg";
import { storeVertical, useVerticalTheme } from "@/hooks/useVerticalTheme";

const BoasVindasSalao = () => {
  const navigate = useNavigate();

  // Garante que este ambiente sempre aplique e salve o tema do Salão.
  useVerticalTheme("salao");

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "#08060E" }}>
      {/* Background image with deep purple overlay */}
      <div className="absolute inset-0 -z-10">
        <img src={heroSalon} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,6,14,0.92) 0%, rgba(20,10,40,0.88) 50%, rgba(8,6,14,0.95) 100%)" }} />
        {/* Amethyst radial glows */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 25%, rgba(120,60,200,0.12), transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 30% 70%, rgba(88,28,135,0.08), transparent 60%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 40% 40% at 70% 60%, rgba(139,92,246,0.06), transparent 50%)" }} />
        {/* Top & bottom accent lines */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 10%, rgba(139,92,246,0.4) 50%, transparent 90%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent 20%, rgba(88,28,135,0.3) 50%, transparent 80%)" }} />
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-lg"
        >
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-6 backdrop-blur-sm"
            style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)" }}
          >
            <Star className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} />
            <span className="text-xs font-medium" style={{ color: "rgba(200,180,240,0.8)" }}>Ambiente Salão de Beleza</span>
          </div>

          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "linear-gradient(135deg, #7C3AED, #581C87)", boxShadow: "0 8px 30px rgba(124,58,237,0.3)" }}
          >
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4" style={{ color: "rgba(245,240,255,0.95)" }}>
            Bem-vindo ao ambiente{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #A78BFA, #C4B5FD, #8B5CF6)" }}>
              Salão de Beleza
            </span>
          </h1>

          <p className="leading-relaxed mb-8 max-w-md mx-auto" style={{ color: "rgba(180,170,210,0.75)" }}>
            Gerencie seu salão com ferramentas profissionais: agenda inteligente, controle financeiro e atendimento automatizado via WhatsApp.
          </p>

          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(180,170,210,0.7)" }}>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} /> Agenda inteligente</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" style={{ color: "#A78BFA" }} /> Antifuro</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/login?vertical=salao")}
              className="text-white border-0"
              style={{ background: "linear-gradient(135deg, #7C3AED, #581C87)", boxShadow: "0 4px 20px rgba(124,58,237,0.35)" }}
            >
              Criar conta
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                storeVertical("salao");
                navigate("/login?vertical=salao");
              }}
              style={{ borderColor: "rgba(139,92,246,0.3)", color: "rgba(200,180,240,0.85)", background: "rgba(139,92,246,0.06)" }}
            >
              Já tenho conta
            </Button>
          </div>

          <button onClick={() => navigate("/")} className="mt-8 text-xs transition-colors" style={{ color: "rgba(160,150,200,0.5)" }}>
            Voltar para a página inicial
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BoasVindasSalao;
