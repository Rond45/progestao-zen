import { Button } from "@/components/ui/button";
import { Plus, Clock, DollarSign, MoreHorizontal } from "lucide-react";

const services = [
  { id: 1, name: "Corte", duration: "30 min", price: "R$ 45", category: "Cabelo" },
  { id: 2, name: "Barba", duration: "20 min", price: "R$ 35", category: "Barba" },
  { id: 3, name: "Corte + Barba", duration: "50 min", price: "R$ 70", category: "Combo" },
  { id: 4, name: "Sobrancelha", duration: "10 min", price: "R$ 15", category: "Acabamento" },
  { id: 5, name: "Pezinho", duration: "10 min", price: "R$ 10", category: "Acabamento" },
  { id: 6, name: "Hidratacao capilar", duration: "40 min", price: "R$ 55", category: "Tratamento" },
];

const Servicos = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servicos</h1>
          <p className="text-sm text-muted-foreground mt-1">{services.length} servicos cadastrados</p>
        </div>
        <Button variant="emerald" size="sm">
          <Plus className="h-4 w-4" />
          Novo servico
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.id} className="rounded-lg border border-border bg-card p-5 hover:border-primary/30 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{service.category}</span>
              </div>
              <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {service.duration}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <DollarSign className="h-3.5 w-3.5 text-primary" />
                {service.price}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Servicos;
