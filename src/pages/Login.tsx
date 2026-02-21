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
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (vertical) storeVertical(vertical);
  }, [vertical]);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
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
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
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
          <Button type="submit" variant="emerald" className="w-full" size="lg" disabled={loading}>
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
