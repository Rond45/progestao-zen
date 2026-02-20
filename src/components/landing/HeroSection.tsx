import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, Scissors, Sparkles } from "lucide-react";
import heroBarbershop from "@/assets/hero-barbershop.jpg";
import heroSalon from "@/assets/hero-salon.jpg";

type Vertical = "barbearia" | "salao";

const content = {
  barbearia: {
    headline: "Gestão profissional para sua",
    highlight: "barbearia",
    image: heroBarbershop,
    glowOpacity: 0.08,
  },
  salao: {
    headline: "Gestão profissional para seu",
    highlight: "salão de beleza",
    image: heroSalon,
    glowOpacity: 0.06,
  },
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [vertical, setVertical] = useState<Vertical>("barbearia");
  const data = content[vertical];

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
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 mb-6">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Plataforma exclusiva para barbearias e salões
              </span>
            </div>

            {/* Toggle */}
            <div
              className="inline-flex items-center rounded-full p-1 mb-8 gap-1"
              style={{
                background: "#11151B",
                border: "1px solid #1D2430",
              }}
            >
              {([
                { key: "barbearia" as Vertical, label: "Barbearia", icon: Scissors },
                { key: "salao" as Vertical, label: "Salão de Beleza", icon: Sparkles },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setVertical(key)}
                  className="relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-250"
                  style={
                    vertical === key
                      ? {
                          background: "linear-gradient(135deg, #0F1F18, #10251D)",
                          border: "1px solid #10B981",
                          color: "#10B981",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid transparent",
                          color: "#B6C0CC",
                        }
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Headline */}
            <AnimatePresence mode="wait">
              <motion.h1
                key={vertical}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {data.headline}{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(90deg, #10B981, #34D399)",
                  }}
                >
                  {data.highlight}
                </span>
              </motion.h1>
            </AnimatePresence>

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
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div
              className="relative rounded-2xl overflow-hidden border border-border aspect-video"
              style={{
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={vertical}
                  src={data.image}
                  alt={
                    vertical === "barbearia"
                      ? "Ambiente profissional de barbearia"
                      : "Ambiente profissional de salão de beleza"
                  }
                  className="w-full h-full object-cover absolute inset-0"
                  loading="lazy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              </AnimatePresence>

              {/* Dark overlay */}
              <div
                className="absolute inset-0"
                style={{ background: "rgba(10,15,20,0.55)" }}
              />

              {/* Emerald glow */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(16,185,129,${data.glowOpacity}), transparent 70%)`,
                }}
              />

              {/* Vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 50%, rgba(10,15,20,0.4) 100%)",
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
