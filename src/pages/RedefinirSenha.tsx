import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const RedefinirSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Escuta o evento PASSWORD_RECOVERY disparado pelo link do e-mail.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady(true);
        setLinkError(null);
      }
    });

    // Verifica se já existe uma sessão ativa (caso o token já tenha sido processado).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        // Se não há sessão e não há hash de recuperação na URL, o link é inválido.
        const hash = window.location.hash;
        if (!hash.includes("access_token") && !hash.includes("type=recovery")) {
          setLinkError("Link inválido ou expirado. Solicite um novo e-mail de recuperação.");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas diferentes", description: "As duas senhas devem ser iguais.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Senha atualizada", description: "Sua nova senha foi definida com sucesso." });
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (error: any) {
      const msg = error?.message || "";
      toast({
        title: "Erro",
        description: msg.includes("session")
          ? "Sessão de recuperação expirada. Solicite um novo link."
          : "Não foi possível atualizar a senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!resendEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resendEmail, {
        redirectTo: window.location.origin + "/redefinir-senha",
      });
      if (error) throw error;
      toast({ title: "Link enviado", description: "Verifique seu e-mail para redefinir a senha." });
      setResendEmail("");
    } catch {
      toast({ title: "Erro", description: "Não foi possível enviar o link. Tente novamente.", variant: "destructive" });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/login")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </button>
          <div className="flex items-center justify-center mb-3">
            <Logo height="h-12" />
          </div>
          <p className="text-sm text-muted-foreground">Defina sua nova senha</p>
        </div>

        {linkError ? (
          <div className="space-y-4">
            <div className="p-4 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-foreground">
              {linkError}
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Solicitar novo link</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
              />
              <Button variant="emerald" className="w-full" size="lg" disabled={resending || !resendEmail} onClick={handleResend}>
                {resending ? "Enviando..." : "Enviar novo link"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground/50 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-sm text-muted-foreground">Confirmar nova senha</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" variant="emerald" className="w-full" size="lg" disabled={loading || !sessionReady}>
              {loading ? "Salvando..." : sessionReady ? "Salvar nova senha" : "Aguardando link..."}
            </Button>

            {!sessionReady && (
              <p className="text-xs text-muted-foreground text-center">
                Abra esta página pelo link enviado ao seu e-mail.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default RedefinirSenha;