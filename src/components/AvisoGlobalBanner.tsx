import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Info, AlertTriangle } from "lucide-react";

const AvisoGlobalBanner = () => {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("avisos_dismissed") || "[]";
      setDismissed(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  const { data: aviso } = useQuery({
    queryKey: ["aviso-global"],
    queryFn: async () => {
      const { data } = await supabase
        .from("avisos_globais")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    refetchInterval: 60_000,
  });

  if (!aviso || dismissed.includes(aviso.id)) return null;

  const isAlert = aviso.tipo === "alerta";
  const Icon = isAlert ? AlertTriangle : Info;

  const dismiss = () => {
    const next = [...dismissed, aviso.id];
    setDismissed(next);
    sessionStorage.setItem("avisos_dismissed", JSON.stringify(next));
  };

  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 text-sm border-b ${
      isAlert
        ? "bg-amber-50 border-amber-200 text-amber-900"
        : "bg-blue-50 border-blue-200 text-blue-800"
    }`}>
      <Icon className={`h-4 w-4 shrink-0 ${isAlert ? "text-amber-700" : "text-blue-700"}`} />
      <p className="flex-1 font-medium">{aviso.mensagem}</p>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AvisoGlobalBanner;
