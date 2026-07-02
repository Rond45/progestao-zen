import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { QrCode, CreditCard, Copy, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

type PlanoId = "basico" | "pro" | "premium";
const PLAN_PRICE: Record<PlanoId, string> = { basico: "39", pro: "79", premium: "149" };
const PLAN_LABEL: Record<PlanoId, string> = { basico: "Básico", pro: "Pro", premium: "Premium" };

type Step = "choose" | "pix" | "loading";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano: PlanoId;
  dismissible?: boolean;
}

export default function PagamentoModal({ open, onOpenChange, plano, dismissible = true }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("choose");
  const [loadingMethod, setLoadingMethod] = useState<"pix" | "cartao" | null>(null);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("choose");
      setPixData(null);
      setLoadingMethod(null);
      if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [open]);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  const startPolling = () => {
    if (!user) return;
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, acesso_valido_ate")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!data) return;
      const valid = data.acesso_valido_ate
        ? new Date(data.acesso_valido_ate).getTime() > Date.now()
        : false;
      if (data.status === "active" && valid) {
        if (pollRef.current) { window.clearInterval(pollRef.current); pollRef.current = null; }
        toast.success("Pagamento confirmado! Bem-vindo ao seu plano.");
        onOpenChange(false);
        navigate("/dashboard");
      }
    }, 4000);
  };

  const handlePix = async () => {
    setLoadingMethod("pix");
    try {
      const { data, error } = await supabase.functions.invoke("criar-pagamento-pix", { body: { plano } });
      if (error) throw error;
      if (!data?.qr_code) throw new Error("QR Code não recebido");
      setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64 });
      setStep("pix");
      startPolling();
    } catch (e: any) {
      toast.error("Erro ao gerar Pix: " + (e?.message ?? "tente novamente"));
    } finally {
      setLoadingMethod(null);
    }
  };

  const handleCartao = async () => {
    setLoadingMethod("cartao");
    try {
      const { data, error } = await supabase.functions.invoke("criar-assinatura-cartao", { body: { plano } });
      if (error) throw error;
      if (!data?.init_point) throw new Error("Checkout não retornado");
      window.location.href = data.init_point;
    } catch (e: any) {
      toast.error("Erro ao iniciar cartão: " + (e?.message ?? "tente novamente"));
      setLoadingMethod(null);
    }
  };

  const copyPix = async () => {
    if (!pixData) return;
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      toast.success("Código Pix copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v && !dismissible) return;
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-md border-primary/30 shadow-[0_20px_50px_-10px_rgba(184,143,60,0.35)]"
        onInteractOutside={(e) => { if (!dismissible) e.preventDefault(); }}
        onEscapeKeyDown={(e) => { if (!dismissible) e.preventDefault(); }}
      >
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Plano {PLAN_LABEL[plano]} — R${PLAN_PRICE[plano]}/mês</DialogTitle>
              <DialogDescription>Escolha como deseja pagar sua assinatura.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 pt-2">
              <button
                type="button"
                onClick={handlePix}
                disabled={!!loadingMethod}
                className="group text-left rounded-xl border-2 border-border hover:border-primary/60 hover:bg-primary/5 p-4 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5"><QrCode className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Pagar com Pix (mensal)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Você paga todo mês pelo QR Code e recebe o aviso dentro do sistema.</p>
                  </div>
                  {loadingMethod === "pix" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              </button>
              <button
                type="button"
                onClick={handleCartao}
                disabled={!!loadingMethod}
                className="group text-left rounded-xl border-2 border-border hover:border-primary/60 hover:bg-primary/5 p-4 transition-all shadow-sm hover:shadow-md disabled:opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5"><CreditCard className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Pagar com Cartão (assinatura automática)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">A cobrança acontece automaticamente todo mês, sem preocupação.</p>
                  </div>
                  {loadingMethod === "cartao" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              </button>
            </div>
          </>
        )}

        {step === "pix" && pixData && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep("choose")} className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-xl">Pague com Pix — R${PLAN_PRICE[plano]}</DialogTitle>
              </div>
              <DialogDescription>Plano {PLAN_LABEL[plano]}. Escaneie o QR Code ou copie o código abaixo.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-3">
              {pixData.qr_code_base64 && (
                <div className="rounded-xl border-2 border-border bg-white p-3 shadow-md">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="h-56 w-56"
                  />
                </div>
              )}
              <Button variant="outline" onClick={copyPix} className="w-full">
                <Copy className="h-4 w-4 mr-2" /> Copiar código Pix
              </Button>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando confirmação do pagamento...
              </div>
              <p className="text-xs text-muted-foreground text-center">
                A confirmação é automática e pode levar alguns segundos após o pagamento.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}