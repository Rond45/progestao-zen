import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Scissors, Sparkles } from "lucide-react";
import heroBarbershop from "@/assets/hero-barbershop.jpg";
import heroSalon from "@/assets/hero-salon.jpg";

const verticals = [
{
  key: "barbearia",
  title: "Barbearia",
  subtitle: "Gestao profissional para corte, barba e mais",
  image: heroBarbershop,
  icon: Scissors,
  route: "/barbearia/boas-vindas",
  btnLabel: "Selecionar Barbearia"
},
{
  key: "salao",
  title: "Salao de Beleza",
  subtitle: "Gestao completa para saloes e studios",
  image: heroSalon,
  icon: Sparkles,
  route: "/salao/boas-vindas",
  btnLabel: "Selecionar Salao"
}];


const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: "radial-gradient(circle at 50% 30%, rgba(16,185,129,0.06), transparent 50%)"
        }} />


      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>

          <h1 className="text-3xl md:text-5xl font-bold text-foreground leading-tight tracking-tight mb-4">
            Gestão profissional para seu{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #10B981, #34D399)" }}>
              negocio
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Escolha seu segmento e comece a gerenciar com ferramentas inteligentes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {verticals.map((v, i) =>
          <motion.div
            key={v.key}
            className="rounded-2xl border border-border overflow-hidden cursor-pointer group transition-all duration-300 hover:border-primary/40 hover:scale-[1.02]"
            style={{ boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.15 }}
            onClick={() => navigate(v.route)}>

              <div className="relative h-48 overflow-hidden">
                <img src={v.image} alt={v.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0" style={{ background: "rgba(10,15,20,0.6)" }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  


                </div>
              </div>
              <div className="p-6 bg-card">
                <h3 className="text-xl font-bold text-foreground mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{v.subtitle}</p>
                <Button variant="emerald" className="w-full" onClick={(e) => {e.stopPropagation();navigate(v.route);}}>
                  {v.btnLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

export default HeroSection;