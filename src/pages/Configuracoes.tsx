import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Store, Clock, Shield, Users, Bell } from "lucide-react";

const Configuracoes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajustes gerais do seu negocio</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Business info */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Dados do negocio</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome da barbearia</Label>
              <Input defaultValue="Barbearia Premium" className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Telefone</Label>
              <Input defaultValue="(11) 99999-9999" className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Endereco</Label>
              <Input defaultValue="Rua Exemplo, 123 - Sao Paulo, SP" className="bg-background border-border text-foreground" />
            </div>
            <Button variant="gold" size="sm">Salvar alteracoes</Button>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Horario de funcionamento</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Abertura</Label>
              <Input type="time" defaultValue="09:00" className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Fechamento</Label>
              <Input type="time" defaultValue="19:00" className="bg-background border-border text-foreground" />
            </div>
          </div>
        </div>

        {/* Anti-no-show */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Politica antifuro</h3>
          </div>
          <div className="space-y-3">
            {["Sem sinal", "Sinal Pix fixo", "Sinal percentual", "Apenas confirmacao"].map((opt, i) => (
              <label key={opt} className={`flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${i === 3 ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${i === 3 ? "border-primary" : "border-muted-foreground/50"}`}>
                  {i === 3 && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Equipe</h3>
            </div>
            <Button variant="outline" size="sm">Adicionar</Button>
          </div>
          <div className="space-y-3">
            {[
              { name: "Joao", role: "Profissional", commission: "40%" },
              { name: "Rafael", role: "Profissional", commission: "40%" },
              { name: "Lucas", role: "Profissional", commission: "40%" },
            ].map((m) => (
              <div key={m.name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-xs font-semibold text-muted-foreground">{m.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <span className="text-sm text-primary font-medium">{m.commission}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
