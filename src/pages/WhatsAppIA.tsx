import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Wifi,
  WifiOff,
  Send,
  Bot,
  Clock,
  Settings,
  FileText,
} from "lucide-react";

const logs = [
  { time: "10:32", direction: "in", client: "Carlos Silva", message: "Boa tarde, quero agendar um corte pra amanha" },
  { time: "10:32", direction: "out", client: "Carlos Silva", message: "Ola, Carlos. Temos horarios disponiveis amanha as 09:00, 10:30 e 14:00. Qual prefere?" },
  { time: "10:33", direction: "in", client: "Carlos Silva", message: "10:30 com o Joao" },
  { time: "10:33", direction: "out", client: "Carlos Silva", message: "Agendamento confirmado: Corte com Joao, amanha as 10:30. Ate la." },
  { time: "11:15", direction: "in", client: "Pedro Santos", message: "Tem horario hoje?" },
  { time: "11:15", direction: "out", client: "Pedro Santos", message: "Ola, Pedro. Hoje temos disponibilidade as 15:00 e 16:30. Deseja agendar?" },
];

const automations = [
  { name: "Confirmacao 24h antes", status: "Ativa", sent: 142 },
  { name: "Lembrete 2h antes", status: "Ativa", sent: 138 },
  { name: "Pos-atendimento", status: "Ativa", sent: 95 },
  { name: "Reagendamento de faltas", status: "Inativa", sent: 12 },
];

const WhatsAppIA = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp IA</h1>
          <p className="text-sm text-muted-foreground mt-1">Automacao de atendimento via WhatsApp</p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
          Configurar
        </Button>
      </div>

      {/* Connection status */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">WhatsApp conectado</p>
              <p className="text-xs text-muted-foreground">+55 11 99999-9999</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Online
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Automations */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Automacoes</h3>
          </div>
          <div className="space-y-3">
            {automations.map((a) => (
              <div key={a.name} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.sent} enviadas</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.status === "Ativa" ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground"
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent logs */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Conversas recentes</h3>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={`flex gap-3 ${log.direction === "out" ? "flex-row-reverse" : ""}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  log.direction === "out" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground"
                }`}>
                  <p className="text-xs font-medium text-muted-foreground mb-0.5">
                    {log.direction === "out" ? "IA" : log.client}
                  </p>
                  <p className="text-sm">{log.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppIA;
