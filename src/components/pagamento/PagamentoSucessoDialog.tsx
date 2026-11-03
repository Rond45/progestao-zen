import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const PLAN_LABEL_SUCESSO: Record<string, string> = { basico: "Básico", pro: "Pro", premium: "Premium" };

export function formatDataBR(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PagamentoSucessoContent({
  plano,
  acessoValidoAte,
  onDone,
}: {
  plano: string;
  acessoValidoAte: string | null;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center text-center gap-4 py-6">
      <CheckCircle2 className="h-20 w-20 text-primary" strokeWidth={1.5} />
      <DialogTitle className="text-2xl font-bold text-foreground">Pagamento aprovado!</DialogTitle>
      <DialogDescription className="text-base text-foreground/80 max-w-sm">
        Seu plano {PLAN_LABEL_SUCESSO[plano] ?? plano} está liberado até {formatDataBR(acessoValidoAte)}. Obrigado por escolher o ProGestão+!
      </DialogDescription>
      <Button
        size="lg"
        className="w-full mt-2 h-12 text-base"
        onClick={() => {
          onDone();
          navigate("/dashboard");
        }}
      >
        Ir para o painel
      </Button>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: string;
  acessoValidoAte: string | null;
}

export default function PagamentoSucessoDialog({ open, onOpenChange, plano, acessoValidoAte }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-primary/30">
        <PagamentoSucessoContent plano={plano} acessoValidoAte={acessoValidoAte} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
