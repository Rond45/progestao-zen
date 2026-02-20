import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Store, Clock, Shield, Users, Lock, Plus } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const policyOptions = [
  { value: "none", label: "Sem sinal" },
  { value: "fixed_deposit", label: "Sinal Pix fixo" },
  { value: "percentage_deposit", label: "Sinal percentual" },
  { value: "confirmation_only", label: "Apenas confirmacao" },
];

const Configuracoes = () => {
  const { businessId, business } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Business form
  const [bizForm, setBizForm] = useState({ name: "", phone: "", address: "" });
  const [timeForm, setTimeForm] = useState({ opening: "09:00", closing: "19:00" });

  useEffect(() => {
    if (business) {
      setBizForm({ name: business.name || "", phone: business.phone || "", address: business.address || "" });
      setTimeForm({
        opening: business.opening_time?.slice(0, 5) || "09:00",
        closing: business.closing_time?.slice(0, 5) || "19:00",
      });
    }
  }, [business]);

  const saveBiz = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("businesses").update({
        name: bizForm.name, phone: bizForm.phone, address: bizForm.address,
        opening_time: timeForm.opening, closing_time: timeForm.closing,
      }).eq("id", businessId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business"] });
      toast({ title: "Dados salvos" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Anti-furo
  const { data: antifuro } = useQuery({
    queryKey: ["antifuro", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("antifuro_policies").select("*").eq("business_id", businessId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const [selectedPolicy, setSelectedPolicy] = useState("confirmation_only");

  useEffect(() => {
    if (antifuro) setSelectedPolicy(antifuro.policy_type);
  }, [antifuro]);

  const saveAntifuro = useMutation({
    mutationFn: async () => {
      if (antifuro) {
        const { error } = await supabase.from("antifuro_policies").update({ policy_type: selectedPolicy, updated_at: new Date().toISOString() }).eq("business_id", businessId!);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("antifuro_policies").insert({ business_id: businessId!, policy_type: selectedPolicy });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["antifuro"] });
      toast({ title: "Politica salva" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Finance access
  const { data: financeAccess } = useQuery({
    queryKey: ["finance-access", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("finance_access").select("*").eq("business_id", businessId!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const [finForm, setFinForm] = useState({ name: "", password: "", confirm: "" });

  useEffect(() => {
    if (financeAccess) setFinForm((f) => ({ ...f, name: financeAccess.name }));
  }, [financeAccess]);

  const saveFinAccess = useMutation({
    mutationFn: async () => {
      if (finForm.password && finForm.password !== finForm.confirm) throw new Error("Senhas nao conferem");
      const payload: any = { name: finForm.name };
      if (finForm.password) payload.password_hash = finForm.password; // In prod use bcrypt
      payload.updated_at = new Date().toISOString();

      if (financeAccess) {
        const { error } = await supabase.from("finance_access").update(payload).eq("business_id", businessId!);
        if (error) throw error;
      } else {
        if (!finForm.password) throw new Error("Senha obrigatoria");
        const { error } = await supabase.from("finance_access").insert({ ...payload, business_id: businessId! });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-access"] });
      toast({ title: "Acesso financeiro salvo" });
      setFinForm((f) => ({ ...f, password: "", confirm: "" }));
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Team members (using profiles table)
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team-members", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*").eq("business_id", businessId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
        <p className="text-sm text-muted-foreground mt-1">Ajustes gerais do seu negocio</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Business info */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Store className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Dados do negocio</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome</Label>
              <Input value={bizForm.name} onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Telefone</Label>
              <Input value={bizForm.phone} onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Endereco</Label>
              <Input value={bizForm.address} onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Horario de funcionamento</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Abertura</Label>
              <Input type="time" value={timeForm.opening} onChange={(e) => setTimeForm({ ...timeForm, opening: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Fechamento</Label>
              <Input type="time" value={timeForm.closing} onChange={(e) => setTimeForm({ ...timeForm, closing: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
          </div>
          <Button variant="emerald" size="sm" className="mt-4" onClick={() => saveBiz.mutate()} disabled={saveBiz.isPending}>
            {saveBiz.isPending ? "Salvando..." : "Salvar alteracoes"}
          </Button>
        </div>

        {/* Anti-furo */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Politica antifuro</h3>
          </div>
          <div className="space-y-3">
            {policyOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 rounded-md border px-4 py-3 cursor-pointer transition-colors ${
                  selectedPolicy === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                }`}
                onClick={() => setSelectedPolicy(opt.value)}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedPolicy === opt.value ? "border-primary" : "border-muted-foreground/50"
                }`}>
                  {selectedPolicy === opt.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <span className="text-sm text-foreground">{opt.label}</span>
              </label>
            ))}
          </div>
          <Button variant="emerald" size="sm" className="mt-4" onClick={() => saveAntifuro.mutate()} disabled={saveAntifuro.isPending}>
            {saveAntifuro.isPending ? "Salvando..." : "Salvar politica"}
          </Button>
        </div>

        {/* Finance access */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">Acesso ao Financeiro</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Nome do responsavel</Label>
              <Input value={finForm.name} onChange={(e) => setFinForm({ ...finForm, name: e.target.value })} className="bg-background border-border text-foreground" required />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">{financeAccess ? "Nova senha (deixe vazio para manter)" : "Senha"}</Label>
              <Input type="password" value={finForm.password} onChange={(e) => setFinForm({ ...finForm, password: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Confirmar senha</Label>
              <Input type="password" value={finForm.confirm} onChange={(e) => setFinForm({ ...finForm, confirm: e.target.value })} className="bg-background border-border text-foreground" />
            </div>
            <Button variant="emerald" size="sm" onClick={() => saveFinAccess.mutate()} disabled={saveFinAccess.isPending}>
              {saveFinAccess.isPending ? "Salvando..." : "Salvar acesso"}
            </Button>
          </div>
        </div>

        {/* Team */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-base font-semibold text-foreground">Equipe</h3>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/dashboard/profissionais"}>
              <Plus className="h-3.5 w-3.5" /> Gerenciar
            </Button>
          </div>
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum profissional cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-xs font-semibold text-muted-foreground">{m.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.specialty || "Profissional"}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {m.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
