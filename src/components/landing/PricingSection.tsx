import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    id: "basico",
    name: "Básico",
    price: "39",
    description: "Ideal para profissionais autônomos",
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

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="planos"
      className="py-24 border-t border-border relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0A0F14 0%, #12100a 30%, #1a1508 50%, #0d0b06 70%, #0A0F14 100%)",
      }}
    >
      {/* Gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 30%, rgba(184,143,60,0.07), transparent 70%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(184,143,60,0.04), transparent 60%)",
        }}
      />
      {/* Subtle gold line accent */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/3"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(184,143,60,0.3), transparent)",
        }}
      />
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos que cabem no seu bolso
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Comece grátis e evolua conforme seu negócio cresce.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`rounded-xl border p-6 flex flex-col transition-all duration-250 relative ${
                plan.popular
                  ? "border-[rgba(184,143,60,0.4)]"
                  : "border-border/60 hover:border-[rgba(184,143,60,0.25)]"
              }`}
              style={{
                background: "linear-gradient(135deg, rgba(20,18,12,0.9), rgba(14,12,10,0.95))",
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #b88f3c, #d4a84b)", color: "#0A0F14" }}>
                  Mais popular
                </div>
              )}
              <h3 className="text-lg font-bold text-foreground mb-1">
                {plan.name}
              </h3>
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
                onClick={() => {
                  localStorage.setItem("selectedPlan", plan.id);
                  navigate("/login");
                }}
              >
                Começar agora
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
