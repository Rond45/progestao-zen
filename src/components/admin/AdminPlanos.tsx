import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCall } from "./AdminOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminPlanos = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-plans-config"],
    queryFn: () => adminCall("get-plans-config"),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: () => adminCall("save-plans-config", { config: form }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-plans-config"] });
      toast({ title: "Planos atualizados!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const row = (key: string, label: string, placeholder = "") => (
    <div className="space-y-1">
      <Label className="text-xs text-zinc-400">{label}</Label>
      <Input value={form[key] ?? ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder} className="bg-zinc-950 border-zinc-800 text-zinc-100" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Controle de Planos</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Valores exibidos no site e usados no dashboard. O checkout ainda usa os preços fixos no gateway de pagamento.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-6">
        {[
          { id: "basico", nome: "Básico" },
          { id: "pro", nome: "Pro" },
          { id: "premium", nome: "Premium" },
        ].map((p) => (
          <div key={p.id} className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200">Plano {p.nome}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {row(`plan_${p.id}_price`, "Preço mensal (R$)")}
              {row(`plan_${p.id}_prof`, "Limite de profissionais")}
            </div>
          </div>
        ))}

        <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}
          className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
          {save.isPending ? "Salvando..." : "Salvar planos"}
        </Button>
      </div>
    </div>
  );
};

export default AdminPlanos;