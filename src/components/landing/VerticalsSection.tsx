import { motion } from "framer-motion";
import { Scissors, Sparkles, Check } from "lucide-react";
import verticalBarber from "@/assets/vertical-barbershop.jpg";
import verticalSalon from "@/assets/vertical-salon.jpg";

const verticals = [
{
  icon: Scissors,
  title: "Barbearia",
  description:
  "Corte, barba, sobrancelha e mais. Termos e métricas pensados para o universo masculino.",
  image: verticalBarber,
  items: [
  "Serviços pré-configurados",
  "Dashboard especializado",
  "Linguagem adaptada"]

},
{
  icon: Sparkles,
  title: "Salão de Beleza",
  description:
  "Corte feminino, escova, progressiva e mais. Interface pensada para salões completos.",
  image: verticalSalon,
  items: [
  "Serviços pré-configurados",
  "Dashboard especializado",
  "Linguagem adaptada"]

}];


const VerticalsSection = () => {
  return (
    <section
      className="py-24 border-t border-border relative overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0A0F14 0%, #0d0a12 40%, #0A0F14 100%)"
      }}>
      {/* Subtle purple ambient for salon context */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 50% at 70% 50%, rgba(88,28,135,0.06), transparent 60%)" }} />

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
          {verticals.map((v, i) =>
          <motion.div
            key={v.title}
            className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary transition-all duration-250 hover:scale-[1.02]"
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}>

              <div className="relative h-40 overflow-hidden">
                <img
                src={v.image}
                alt={v.title}
                className="w-full h-full object-cover"
                loading="lazy" />

                <div
                className="absolute inset-0"
                style={{ background: "rgba(10,15,20,0.6)" }} />

                <div className="absolute inset-0 flex items-center justify-center">
                  
                </div>
              </div>
              <div className="p-8 text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {v.description}
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  {v.items.map((item) =>
                <li key={item} className="flex items-center justify-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary" />
                      {item}
                    </li>
                )}
                </ul>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>);

};

export default VerticalsSection;