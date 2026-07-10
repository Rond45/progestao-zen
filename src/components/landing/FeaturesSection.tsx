import { motion } from "framer-motion";
import iconAgenda from "@/assets/feature-agenda.png.asset.json";
import iconWhatsapp from "@/assets/feature-whatsapp.png.asset.json";
import iconCrm from "@/assets/feature-crm.png.asset.json";
import iconFinanceiro from "@/assets/feature-financeiro.png.asset.json";
import iconAntifuro from "@/assets/feature-antifuro.png.asset.json";
import iconMultitenant from "@/assets/feature-multitenant.png.asset.json";

const features = [
  {
    icon: iconAgenda.url,
    title: "Agenda Inteligente",
    description:
      "Gestão completa de horários com bloqueios, pausas e controle por profissional.",
  },
  {
    icon: iconWhatsapp.url,
    title: "WhatsApp com IA",
    description:
      "Agendamento automatizado, confirmações e lembretes direto no WhatsApp.",
  },
  {
    icon: iconCrm.url,
    title: "CRM de Clientes",
    description:
      "Histórico completo, tags, preferências e reconhecimento automático.",
  },
  {
    icon: iconFinanceiro.url,
    title: "Financeiro Completo",
    description:
      "Caixa diário, comissões automáticas e relatórios por profissional.",
  },
  {
    icon: iconAntifuro.url,
    title: "Política Antifuro",
    description:
      "Sinais via Pix, confirmações obrigatórias e controle de faltas.",
  },
  {
    icon: iconMultitenant.url,
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
    <section
      id="funcionalidades"
      className="py-24 border-t border-border relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0A0F14 0%, #1a1508 35%, #0d0b06 55%, #0A0F14 100%)",
      }}
    >
      {/* Gold ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 30% 20%, rgba(184,143,60,0.08), transparent 70%), radial-gradient(ellipse 50% 50% at 70% 80%, rgba(184,143,60,0.05), transparent 60%)",
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
              className="group rounded-xl border border-border/60 p-6 transition-all duration-250 hover:border-[rgba(184,143,60,0.35)] hover:-translate-y-1 relative flex flex-col sm:flex-row items-start gap-4"
              style={{ background: "linear-gradient(135deg, rgba(20,18,12,0.9), rgba(14,12,10,0.95))", boxShadow: "inset 0 1px 0 rgba(184,143,60,0.06)" }}
              whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(184,143,60,0.1)" }}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <img
                src={feature.icon}
                alt={feature.title}
                loading="lazy"
                width={96}
                height={96}
                className="h-20 w-20 md:h-24 md:w-24 object-contain shrink-0 drop-shadow-[0_6px_18px_rgba(184,143,60,0.25)]"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
