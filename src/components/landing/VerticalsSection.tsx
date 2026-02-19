import { motion } from "framer-motion";
import { Scissors, Sparkles, Check } from "lucide-react";

const verticals = [
  {
    icon: Scissors,
    title: "Barbearia",
    description:
      "Corte, barba, sobrancelha e mais. Termos e métricas pensados para o universo masculino.",
    items: [
      "Serviços pré-configurados",
      "Dashboard especializado",
      "Linguagem adaptada",
    ],
  },
  {
    icon: Sparkles,
    title: "Salão de Beleza",
    description:
      "Corte feminino, escova, progressiva e mais. Interface pensada para salões completos.",
    items: [
      "Serviços pré-configurados",
      "Dashboard especializado",
      "Linguagem adaptada",
    ],
  },
];

const VerticalsSection = () => {
  return (
    <section
      className="py-24 border-t border-border"
      style={{
        background:
          "linear-gradient(180deg, rgba(16,185,129,0.04), transparent)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Adaptado ao seu segmento
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha sua vertical e o sistema se adapta com termos, serviços e
            métricas personalizadas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {verticals.map((v, i) => (
            <motion.div
              key={v.title}
              className="rounded-xl border border-border bg-card p-8 text-center hover:border-primary transition-all duration-250 hover:scale-[1.02]"
              initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <v.icon className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                {v.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {v.description}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                {v.items.map((item) => (
                  <li key={item} className="flex items-center justify-center gap-2">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VerticalsSection;
