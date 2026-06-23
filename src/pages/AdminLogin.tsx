import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError || !authData.user) {
        throw new Error("Credenciais inválidas.");
      }
      const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
        _user_id: authData.user.id,
        _role: "admin",
      });
      if (roleError || isAdmin !== true) {
        await supabase.auth.signOut();
        throw new Error("Esta conta não possui acesso administrativo.");
      }
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <Lock className="h-5 w-5 text-zinc-400" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Acesso Restrito</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-400 text-sm">E-mail</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-400 text-sm">Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
            {loading ? "Validando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
