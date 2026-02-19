import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";

const hours = Array.from({ length: 11 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);
const professionals = ["Joao", "Rafael", "Lucas"];

const mockEvents: Record<string, { time: string; duration: number; client: string; service: string; status: string }[]> = {
  "Joao": [
    { time: "09:00", duration: 2, client: "Carlos Silva", service: "Corte + Barba", status: "Confirmado" },
    { time: "11:00", duration: 1, client: "Pedro Santos", service: "Corte", status: "Marcado" },
    { time: "14:00", duration: 1, client: "Marcos Costa", service: "Barba", status: "Confirmado" },
  ],
  "Rafael": [
    { time: "10:00", duration: 1, client: "Andre Lima", service: "Barba", status: "Em atendimento" },
    { time: "13:00", duration: 2, client: "Felipe Souza", service: "Corte + Barba", status: "Marcado" },
  ],
  "Lucas": [
    { time: "09:00", duration: 1, client: "Bruno Dias", service: "Corte", status: "Confirmado" },
    { time: "15:00", duration: 1, client: "Thiago Rocha", service: "Sobrancelha", status: "Marcado" },
  ],
};

const statusBorder: Record<string, string> = {
  "Confirmado": "border-l-emerald-500",
  "Marcado": "border-l-muted-foreground",
  "Em atendimento": "border-l-primary",
};

const Agenda = () => {
  const [view, setView] = useState<"dia" | "semana">("dia");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os horarios dos profissionais</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <button
              onClick={() => setView("dia")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "dia" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Dia
            </button>
            <button
              onClick={() => setView("semana")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "semana" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Semana
            </button>
          </div>
          <Button variant="gold" size="sm">
            <Plus className="h-4 w-4" />
            Novo agendamento
          </Button>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-4">
        <button className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">Quarta, 19 de fevereiro de 2026</h3>
        <button className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day view */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${professionals.length}, 1fr)` }}>
          <div className="p-3 border-r border-border">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          {professionals.map((p) => (
            <div key={p} className="p-3 text-center border-r border-border last:border-r-0">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center mx-auto mb-1">
                <span className="text-xs font-semibold text-muted-foreground">{p[0]}</span>
              </div>
              <span className="text-xs font-medium text-foreground">{p}</span>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {hours.map((hour) => (
          <div
            key={hour}
            className="grid border-b border-border last:border-b-0"
            style={{ gridTemplateColumns: `60px repeat(${professionals.length}, 1fr)` }}
          >
            <div className="px-3 py-4 border-r border-border">
              <span className="text-xs text-muted-foreground">{hour}</span>
            </div>
            {professionals.map((p) => {
              const event = mockEvents[p]?.find((e) => e.time === hour);
              return (
                <div key={p} className="px-1 py-1 border-r border-border last:border-r-0 min-h-[56px]">
                  {event && (
                    <div className={`rounded-md bg-secondary/60 border-l-2 ${statusBorder[event.status] || "border-l-border"} px-2.5 py-2 cursor-pointer hover:bg-secondary transition-colors`}>
                      <p className="text-xs font-medium text-foreground truncate">{event.client}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{event.service}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Agenda;
