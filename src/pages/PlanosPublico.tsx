import { useNavigate } from "react-router-dom";
import { Check, Crown, Zap, Star, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    id: "basico",
    name: "Básico",
    price: "39",
    description: "Ideal para profissionais autônomos",
    icon: Star,
    features: [
      "1 profissional",
      "Agenda completa",
      "Cadastro de clientes",
      "Financeiro básico",
      "50 agendamentos/mês",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "89",
    description: "Para equipes em crescimento",
    icon: Zap,
    popular: true,
    features: [
      "Até 3 profissionais",
      "WhatsApp IA",
      "CRM completo",
      "Comissões automáticas",
      "200 agendamentos/mês",
      "Política antifuro",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    price: "169",
    description: "Controle total do seu negócio",
    icon: Crown,
    features: [
      "Até 6 profissionais",
      "WhatsApp IA ilimitado",
      "Relatórios avançados",
      "Múltiplas automações",
      "Agendamentos ilimitados",
      "Suporte prioritário",
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const PlanosPublico = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanClick = (planId: string) => {
    localStorage.setItem("selectedPlan", planId);
    navigate("/login");
  };

  const handleJaTenhoPlano = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              ProGestão<span className="text-primary">+</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
            Entrar
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Escolha o plano ideal para você
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece grátis e evolua conforme seu negócio cresce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 flex flex-col transition-all duration-250 ${
                    plan.popular
                      ? "border-[rgba(184,143,60,0.4)]"
                      : "border-border/60 hover:border-[rgba(184,143,60,0.25)]"
                  }`}
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(20,18,12,0.9), rgba(14,12,10,0.95))",
                    boxShadow: plan.popular
                      ? "0 0 0 1px rgba(184,143,60,0.15), 0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(184,143,60,0.1)"
                      : "inset 0 1px 0 rgba(184,143,60,0.06)",
                  }}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  {plan.popular && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2"
                    >
                      <Badge
                        className="text-xs font-semibold px-3 py-1"
                        style={{
                          background:
                            "linear-gradient(135deg, #b88f3c, #d4a84b)",
                          color: "#0A0F14",
                        }}
                      >
                        Mais popular
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">
                      {plan.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-foreground">
                      R${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "emerald" : "outline"}
                    className="w-full"
                    onClick={() => handlePlanClick(plan.id)}
                  >
                    Começar agora
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* "Já tenho um plano" */}
          <div className="text-center mt-12">
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleJaTenhoPlano}
            >
              Já tenho um plano — Acessar minha conta
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlanosPublico;
