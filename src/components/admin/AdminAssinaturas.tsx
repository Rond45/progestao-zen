import { useQuery } from "@tanstack/react-query";
import { adminCall } from "./AdminOverview";
import { Wallet, Users, AlertTriangle, TrendingUp } from "lucide-react";

const statusLabel: Record<string, { label: string; color: string }> = {
  trialing: { label: "Trial", color: "bg-amber-500/10 text-amber-400" },
  active: { label: "Ativo", color: "bg-emerald-500/10 text-emerald-400" },
  past_due: { label: "Vencido", color: "bg-red-500/10 text-red-400" },
  canceled: { label: "Cancelado", color: "bg-zinc-500/10 text-zinc-400" },
  incomplete: { label: "Incompleto", color: "bg-zinc-500/10 text-zinc-400" },
};

const AdminAssinaturas = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-assinaturas"],
    queryFn: () => adminCall("list-assinaturas"),
  });

  const subs = data?.subs ?? [];
  const t = data?.totais ?? { trialing: 0, ativos: 0, vencidos: 0, receita_mensal: 0 };

  const cards = [
    { label: "Em trial", value: t.trialing, icon: Users, color: "text-amber-400" },
    { label: "Ativos", value: t.ativos, icon: Wallet, color: "text-emerald-400" },
    { label: "Vencidos", value: t.vencidos, icon: AlertTriangle, color: "text-red-400" },
    { label: "Receita mensal estimada", value: `R$ ${Number(t.receita_mensal).toFixed(2)}`, icon: TrendingUp, color: "text-blue-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-100">Assinaturas & Pagamentos</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
              <span className="text-xs text-zinc-400">{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-zinc-100">{c.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? <p className="text-zinc-500 text-sm">Carregando...</p> : (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-950 text-zinc-400 text-left">
                <th className="px-3 py-2 font-medium">Cliente / Negócio</th>
                <th className="px-3 py-2 font-medium">Plano</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Método</th>
                <th className="px-3 py-2 font-medium">Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => {
                const sl = statusLabel[s.vencido && s.status === "trialing" ? "past_due" : s.status] || statusLabel.incomplete;
                return (
                  <tr key={s.id} className="border-t border-zinc-800 text-zinc-300">
                    <td className="px-3 py-2">
                      <div>
                        <p className="text-zinc-200">{s.business_name || "—"}</p>
                        <p className="text-[11px] text-zinc-500">{s.owner_name || "—"} {s.vertical ? `· ${s.vertical}` : ""}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize">{s.plan_name || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sl.color}`}>
                        {sl.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 capitalize">{s.metodo_pagamento || "—"}</td>
                    <td className="px-3 py-2 text-zinc-400">
                      {s.acesso_valido_ate ? new Date(s.acesso_valido_ate).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-zinc-500">Nenhuma assinatura registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAssinaturas;