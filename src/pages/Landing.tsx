import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  Users,
  BarChart3,
  Shield,
  Scissors,
  Sparkles,
  ArrowRight,
  Check,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Gestao completa de horarios com bloqueios, pausas e controle por profissional.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp com IA",
    description: "Agendamento automatizado, confirmacoes e lembretes direto no WhatsApp.",
  },
  {
    icon: Users,
    title: "CRM de Clientes",
    description: "Historico completo, tags, preferencias e reconhecimento automatico.",
  },
  {
    icon: BarChart3,
    title: "Financeiro Completo",
    description: "Caixa diario, comissoes automaticas e relatorios por profissional.",
  },
  {
    icon: Shield,
    title: "Politica Antifuro",
    description: "Sinais via Pix, confirmacoes obrigatorias e controle de faltas.",
  },
  {
    icon: Sparkles,
    title: "Multi-tenant",
    description: "Dados isolados por empresa com papeis definidos e acesso controlado.",
  },
];

const plans = [
  {
    name: "Basico",
    price: "39",
    description: "Ideal para profissionais autonomos",
    features: [
      "1 profissional",
      "Agenda completa",
      "Cadastro de clientes",
      "Financeiro basico",
      "50 agendamentos/mes",
    ],
  },
  {
    name: "Pro",
    price: "89",
    description: "Para equipes em crescimento",
    popular: true,
    features: [
      "Ate 3 profissionais",
      "WhatsApp IA",
      "CRM completo",
      "Comissoes automaticas",
      "200 agendamentos/mes",
      "Politica antifuro",
    ],
  },
  {
    name: "Premium",
    price: "169",
    description: "Controle total do seu negocio",
    features: [
      "Ate 6 profissionais",
      "WhatsApp IA ilimitado",
      "Relatorios avancados",
      "Multiplas automacoes",
      "Agendamentos ilimitados",
      "Suporte prioritario",
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

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              ProGestao<span className="text-primary">+</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#planos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Entrar
            </Button>
            <Button variant="emerald" size="sm" onClick={() => navigate("/registro")}>
              Comecar agora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 mb-8">
              <Star className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Plataforma exclusiva para barbearias e saloes
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
              Gestao profissional para o seu{" "}
              <span className="text-primary">negocio de beleza</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              Agende, gerencie e fidelize seus clientes com automacao inteligente via WhatsApp. 
              Tudo em um unico sistema.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="emerald" size="lg" onClick={() => navigate("/registro")}>
                Criar conta gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/login")}>
                Ja tenho conta
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Subtle gradient */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que voce precisa em um so lugar
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ferramentas completas para gerenciar seu negocio de forma profissional e eficiente.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                className="group rounded-lg border border-border bg-card p-6 hover:border-primary/30 transition-colors"
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                <feature.icon className="h-5 w-5 text-primary mb-4" />
                <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Verticals */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Adaptado ao seu segmento
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Escolha sua vertical e o sistema se adapta com termos, servicos e metricas personalizadas.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <motion.div
              className="rounded-lg border border-border bg-card p-8 text-center"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Scissors className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Barbearia</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Corte, barba, sobrancelha e mais. Termos e metricas pensados para o universo masculino.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Servicos pre-configurados</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Dashboard especializado</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Linguagem adaptada</li>
              </ul>
            </motion.div>
            <motion.div
              className="rounded-lg border border-border bg-card p-8 text-center"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Salao de Beleza</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Corte feminino, escova, progressiva e mais. Interface pensada para saloes completos.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Servicos pre-configurados</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Dashboard especializado</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary" /> Linguagem adaptada</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos que cabem no seu bolso
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Comece gratis e evolua conforme seu negocio cresce.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`rounded-lg border p-6 flex flex-col ${
                  plan.popular
                    ? "border-primary/50 bg-card relative"
                    : "border-border bg-card"
                }`}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Mais popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">R${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/mes</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? "emerald" : "outline"}
                  className="w-full"
                  onClick={() => navigate("/registro")}
                >
                  Comecar agora
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                ProGestao<span className="text-primary">+</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Todos os direitos reservados. ProGestao+ 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
