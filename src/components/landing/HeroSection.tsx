import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-barbershop.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(16,185,129,0.08), transparent 40%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(16,185,129,0.04), transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 mb-8">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Plataforma exclusiva para barbearias e salões
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
              Gestão profissional para o seu{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: "linear-gradient(90deg, #10B981, #34D399)",
                }}
              >
                negócio de beleza
              </span>
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
              Agende, gerencie e fidelize seus clientes com automação inteligente
              via WhatsApp. Tudo em um único sistema.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                variant="emerald"
                size="lg"
                onClick={() => navigate("/registro")}
              >
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate("/login")}
              >
                Já tenho conta
              </Button>
            </div>
          </motion.div>

          {/* Right Column – Hero Image */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div
              className="relative rounded-2xl overflow-hidden border border-border"
              style={{
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <img
                src={heroImage}
                alt="Ambiente profissional de barbearia moderna"
                className="w-full h-[480px] object-cover"
                loading="eager"
              />
              {/* Dark overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "rgba(10,15,20,0.55)",
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
