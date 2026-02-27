import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, Camera, Phone, Mail, Save, X } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const ClienteDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { businessId } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });

  const { data: client, isLoading } = useQuery({
    queryKey: ["client-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: serviceHistory = [] } = useQuery({
    queryKey: ["client-service-history", id, businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_executions")
        .select("*, services(name), professionals(name)")
        .eq("business_id", businessId!)
        .eq("client_id", id!)
        .order("performed_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!businessId,
  });

  const updateMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const { error } = await supabase
        .from("clients")
        .update({ name: values.name, phone: values.phone, email: values.email, notes: values.notes })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditing(false);
      toast({ title: "Cliente atualizado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split(".").pop();
      const path = `${businessId}/${id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("client-avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("client-avatars").getPublicUrl(path);
      const avatarUrl = urlData.publicUrl + "?t=" + Date.now();
      const { error: updateError } = await supabase
        .from("clients")
        .update({ avatar_url: avatarUrl })
        .eq("id", id!);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-detail", id] });
      toast({ title: "Foto atualizada" });
    },
    onError: (e: any) => toast({ title: "Erro ao enviar foto", description: e.message, variant: "destructive" }),
  });

  const startEdit = () => {
    if (client) {
      setForm({
        name: client.name || "",
        phone: client.phone || "",
        email: (client as any).email || "",
        notes: client.notes || "",
      });
      setEditing(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarMutation.mutate(file);
  };

  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-12 text-muted-foreground">Cliente nao encontrado.</div>;
  }

  const totalGasto = serviceHistory.reduce((s: number, e: any) => s + (e.service_price_cents || 0), 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </button>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-2 border-border">
              {(client as any).avatar_url ? (
                <img src={(client as any).avatar_url} alt={client.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {client.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Camera className="h-5 w-5 text-foreground" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <form
                onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(form); }}
                className="space-y-3"
              >
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-background border-border text-foreground h-9" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">WhatsApp</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background border-border text-foreground h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs">E-mail</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background border-border text-foreground h-9" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Observacoes</Label>
                  <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-background border-border text-foreground h-9" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="emerald" size="sm" disabled={updateMutation.isPending}>
                    <Save className="h-3.5 w-3.5" /> Salvar
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="h-3.5 w-3.5" /> Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-foreground">{client.name}</h1>
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {client.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5" /> {client.phone}
                    </p>
                  )}
                  {(client as any).email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5" /> {(client as any).email}
                    </p>
                  )}
                  {client.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{client.notes}</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{serviceHistory.length}</p>
          <p className="text-xs text-muted-foreground">Servicos realizados</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-2xl font-bold text-primary">{formatPrice(totalGasto)}</p>
          <p className="text-xs text-muted-foreground">Total gasto</p>
        </div>
      </div>

      {/* History */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-4">Historico de servicos</h3>
        {serviceHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum servico registrado.</p>
        ) : (
          <div className="space-y-3">
            {serviceHistory.map((exec: any) => (
              <div key={exec.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{exec.services?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exec.professionals?.name} - {new Date(exec.performed_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <p className="text-sm font-medium text-primary">{formatPrice(exec.service_price_cents)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDetalhe;
