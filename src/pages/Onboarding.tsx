import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Scissors, Sparkles, ArrowLeft, ArrowRight, Check } from "lucide-react";

type Vertical = "barbearia" | "salao" | null;

const steps = [
  "Escolha sua vertical",
  "Dados do negocio",
  "Horario de funcionamento",
  "Equipe",
  "Servicos",
  "Finalizar",
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [vertical, setVertical] = useState<Vertical>(null);
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");
  const [workAlone, setWorkAlone] = useState<boolean | null>(null);

  const canNext = () => {
    if (step === 0) return vertical !== null;
    if (step === 1) return businessName.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return workAlone !== null;
    return true;
  };

  const handleFinish = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-foreground tracking-tight">
              ProGestao<span className="text-primary">+</span>
            </span>
          </div>
          {/* Progress */}
          <div className="flex items-center justify-center gap-1.5 mb-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "w-8 bg-primary" : "w-4 bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Etapa {step + 1} de {steps.length}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          {/* Step 0: Vertical */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Qual e o seu segmento?</h2>
                <p className="text-sm text-muted-foreground">O sistema sera adaptado ao seu tipo de negocio.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setVertical("barbearia")}
                  className={`rounded-lg border p-6 text-center transition-all ${
                    vertical === "barbearia"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Scissors className={`h-8 w-8 mx-auto mb-3 ${vertical === "barbearia" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${vertical === "barbearia" ? "text-foreground" : "text-muted-foreground"}`}>
                    Barbearia
                  </span>
                </button>
                <button
                  onClick={() => setVertical("salao")}
                  className={`rounded-lg border p-6 text-center transition-all ${
                    vertical === "salao"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Sparkles className={`h-8 w-8 mx-auto mb-3 ${vertical === "salao" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-semibold ${vertical === "salao" ? "text-foreground" : "text-muted-foreground"}`}>
                    Salao de Beleza
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Dados do negocio</h2>
                <p className="text-sm text-muted-foreground">Informacoes basicas da sua {vertical === "barbearia" ? "barbearia" : "empresa"}.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Nome da {vertical === "barbearia" ? "barbearia" : "empresa"}
                  </Label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder={vertical === "barbearia" ? "Ex: Barbearia Premium" : "Ex: Studio Beleza"}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Telefone (WhatsApp)</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Horario de funcionamento</h2>
                <p className="text-sm text-muted-foreground">Defina o horario padrao de atendimento.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Abertura</Label>
                  <Input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Fechamento</Label>
                  <Input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="bg-background border-border text-foreground"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Team */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Sobre sua equipe</h2>
                <p className="text-sm text-muted-foreground">Voce trabalha sozinho ou tem profissionais?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setWorkAlone(true)}
                  className={`rounded-lg border p-5 text-center transition-all ${
                    workAlone === true ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className={`text-sm font-semibold ${workAlone === true ? "text-foreground" : "text-muted-foreground"}`}>
                    Trabalho sozinho
                  </span>
                </button>
                <button
                  onClick={() => setWorkAlone(false)}
                  className={`rounded-lg border p-5 text-center transition-all ${
                    workAlone === false ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className={`text-sm font-semibold ${workAlone === false ? "text-foreground" : "text-muted-foreground"}`}>
                    Tenho equipe
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Services */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Servicos oferecidos</h2>
                <p className="text-sm text-muted-foreground">
                  Sugestoes para {vertical === "barbearia" ? "barbearias" : "saloes"}. Voce pode editar depois.
                </p>
              </div>
              <div className="space-y-2">
                {(vertical === "barbearia"
                  ? ["Corte", "Barba", "Corte + Barba", "Sobrancelha", "Pezinho"]
                  : ["Corte feminino", "Escova", "Hidratacao", "Progressiva", "Manicure", "Pedicure", "Design de sobrancelhas"]
                ).map((service) => (
                  <div key={service} className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm text-foreground">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Finish */}
          {step === 5 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-1">Tudo pronto</h2>
                <p className="text-sm text-muted-foreground">
                  Sua {vertical === "barbearia" ? "barbearia" : "empresa"} esta configurada. 
                  Voce pode ajustar tudo nas configuracoes.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
            ) : (
              <div />
            )}
            {step < steps.length - 1 ? (
              <Button variant="gold" size="sm" onClick={() => setStep(step + 1)} disabled={!canNext()}>
                Proximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="gold" size="sm" onClick={handleFinish}>
                Acessar painel
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
