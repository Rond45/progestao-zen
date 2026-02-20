import { motion } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description:
      "Gestão completa de horários com bloqueios, pausas e controle por profissional.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp com IA",
    description:
      "Agendamento automatizado, confirmações e lembretes direto no WhatsApp.",
  },
  {
    icon: Users,
    title: "CRM de Clientes",
    description:
      "Histórico completo, tags, preferências e reconhecimento automático.",
  },
  {
    icon: BarChart3,
    title: "Financeiro Completo",
    description:
      "Caixa diário, comissões automáticas e relatórios por profissional.",
  },
  {
    icon: Shield,
    title: "Política Antifuro",
    description:
      "Sinais via Pix, confirmações obrigatórias e controle de faltas.",
  },
  {
    icon: Sparkles,
    title: "Multi-tenant",
    description:
      "Dados isolados por empresa com papéis definidos e acesso controlado.",
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

const FeaturesSection = () => {
  return (
    <section id="funcionalidades" className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Ferramentas completas para gerenciar seu negócio de forma
            profissional e eficiente.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group rounded-xl border border-border p-6 transition-all duration-250 hover:border-primary/30 hover:-translate-y-1"
              style={{ background: "#11151B" }}
              whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.4)" }}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <feature.icon className="h-5 w-5 text-primary mb-4" />
              <h3 className="text-base font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
