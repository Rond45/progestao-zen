import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Scissors, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { storeVertical, useVerticalTheme, type Vertical } from "@/hooks/useVerticalTheme";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { TERMOS_VERSAO, PRIVACIDADE_VERSAO } from "@/lib/legalVersions";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Se vier na URL ?vertical=salao ou ?vertical=barbearia, salvamos isso e aplicamos as cores.
  const verticalParam = searchParams.get("vertical");
  const vertical = (verticalParam === "salao" || verticalParam === "barbearia")
    ? (verticalParam as Vertical)
    : null;
  useVerticalTheme(vertical);
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(searchParams.get("signup") === "1");
  const [name, setName] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const translateError = (msg: string): string => {
    if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
    if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
    if (msg.includes("User already registered")) return "Este e-mail já está cadastrado. Tente fazer login.";
    if (msg.includes("at least 6 characters")) return "A senha deve ter pelo menos 6 caracteres.";
    if (msg.includes("Too many requests") || msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    if (msg.includes("weak") || msg.includes("pwned") || msg.includes("known to be weak")) {
      return "Esta senha é muito comum e apareceu em vazamentos públicos. Escolha uma senha mais forte (misture letras maiúsculas, minúsculas, números e símbolos).";
    }
    if (msg.includes("Signups not allowed") || msg.includes("signup is disabled")) return "Cadastros estão temporariamente desativados. Tente novamente em instantes.";
    if (msg.includes("Unable to validate email address") || msg.includes("invalid format")) return "E-mail inválido. Confira o endereço digitado.";
    if (msg.includes("Password should be")) return "Senha muito curta. Use pelo menos 6 caracteres.";
    return "Ocorreu um erro. Tente novamente.";
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/redefinir-senha',
      });
      if (error) throw error;
      toast({ title: "Link enviado", description: "Enviamos um link de recuperação para o seu e-mail." });
      setForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      toast({ title: "Erro", description: translateError(error.message), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vertical) storeVertical(vertical);
  }, [vertical]);

  useEffect(() => {
    if (user) {
      // Se havia aceite pendente (cadastro com confirmação por e-mail), grava agora.
      const pending = localStorage.getItem("pendingAceiteLegal");
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          supabase.from("aceites_legais").insert({
            user_id: user.id,
            versao_termos: parsed.versao_termos ?? TERMOS_VERSAO,
            versao_privacidade: parsed.versao_privacidade ?? PRIVACIDADE_VERSAO,
          }).then(() => localStorage.removeItem("pendingAceiteLegal"));
        } catch {
          localStorage.removeItem("pendingAceiteLegal");
        }
      }
      const selectedPlan = localStorage.getItem("selectedPlan");
      if (selectedPlan) {
        localStorage.removeItem("selectedPlan");
        navigate("/dashboard/planos?plan=" + selectedPlan, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!acceptedTerms) {
          toast({ title: "Aceite necessário", description: "É preciso aceitar os Termos de Uso e a Política de Privacidade.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Salvamos a vertical (barbearia/salão) no cadastro do usuário.
            // O banco (Supabase) usa isso para criar a empresa já no ambiente correto.
            data: { name, vertical: vertical ?? undefined },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // Registra o aceite. Se ainda não há sessão (email confirmation), tenta gravar em background após login.
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const uid = sessionData.session?.user?.id;
          if (uid) {
            await supabase.from("aceites_legais").insert({
              user_id: uid,
              versao_termos: TERMOS_VERSAO,
              versao_privacidade: PRIVACIDADE_VERSAO,
            });
          } else {
            localStorage.setItem("pendingAceiteLegal", JSON.stringify({ versao_termos: TERMOS_VERSAO, versao_privacidade: PRIVACIDADE_VERSAO }));
          }
        } catch (e) {
          console.error("Falha ao registrar aceite legal:", e);
        }
        toast({
          title: "Conta criada",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Navigation is handled by useEffect watching `user` state
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: translateError(error.message || ""),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 text-sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-foreground tracking-tight">
              ProGestao<span className="text-primary">+</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Crie sua conta" : "Acesse sua conta"}
          </p>
          {isSignUp && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-xs text-foreground">
              Você está iniciando seu <strong>teste grátis de 14 dias</strong> com acesso Premium.
              <br />
              Sem cartão de crédito. Sem compromisso.
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm text-muted-foreground">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
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

          {isSignUp && (
            <div className="flex items-start gap-2 pt-1">
              <Checkbox
                id="accept-terms"
                checked={acceptedTerms}
                onCheckedChange={(v) => setAcceptedTerms(v === true)}
                className="mt-0.5"
              />
              <Label htmlFor="accept-terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Li e concordo com os{" "}
                <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Termos de Uso</a>
                {" "}e a{" "}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Política de Privacidade</a>.
              </Label>
            </div>
          )}

          {!isSignUp && !forgotPassword && (
            <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-primary hover:underline">
              Esqueci minha senha
            </button>
          )}

          {forgotPassword && (
            <div className="space-y-2 p-3 rounded-md border border-border bg-card/50">
              <Label className="text-sm text-muted-foreground">Digite seu e-mail para recuperar a senha</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="bg-card border-border text-foreground placeholder:text-muted-foreground/50"
              />
              <div className="flex gap-2">
                <Button type="button" variant="emerald" size="sm" className="flex-1" disabled={loading || !forgotEmail} onClick={handleForgotPassword}>
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => { setForgotPassword(false); setForgotEmail(""); }}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <Button type="submit" variant="emerald" className="w-full" size="lg" disabled={loading || (isSignUp && !acceptedTerms)}>
            {loading ? "Aguarde..." : isSignUp ? "Criar conta" : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
            {isSignUp ? "Entrar" : "Criar conta"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
