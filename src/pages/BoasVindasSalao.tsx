import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Star, Shield, Calendar } from "lucide-react";
import heroSalon from "@/assets/hero-salon.jpg";

const BoasVindasSalao = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 -z-10">
        <img src={heroSalon} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "rgba(10,12,20,0.88)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.06), transparent 60%)" }} />
        {/* Amethyst accent fillets */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.35), transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />
      </div>

      <div className="container mx-auto px-4 flex flex-col items-center justify-center min-h-screen text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-lg"
        >
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-6" style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.08)" }}>
            <Star className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} />
            <span className="text-xs text-muted-foreground font-medium">Ambiente Salao de Beleza</span>
          </div>

          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
            <Sparkles className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
            Bem-vindo ao ambiente{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #8B5CF6, #A78BFA)" }}>
              Salao de Beleza
            </span>
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            Gerencie seu salao com ferramentas profissionais: agenda inteligente, controle financeiro e atendimento automatizado via WhatsApp.
          </p>

          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} /> Agenda inteligente</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" style={{ color: "#8B5CF6" }} /> Antifuro</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login?vertical=salao")} className="text-white" style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}>
              Criar conta
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
              Ja tenho conta
            </Button>
          </div>

          <button onClick={() => navigate("/")} className="mt-8 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Voltar para a pagina inicial
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BoasVindasSalao;
