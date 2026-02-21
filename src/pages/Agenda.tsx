import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Clock } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfDay, endOfDay, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const hours = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

const statusColors: Record<string, string> = {
  scheduled: "border-l-muted-foreground",
  confirmed: "border-l-primary",
  done: "border-l-primary",
  cancelled: "border-l-destructive opacity-50",
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  done: "Concluido",
  cancelled: "Cancelado",
};

const Agenda = () => {
  const { businessId } = useBusiness();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", professional_id: "", service_id: "", date: "", time: "",
  });

  const dayStart = startOfDay(currentDate).toISOString();
  const dayEnd = endOfDay(currentDate).toISOString();

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("*").eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("business_id", businessId!).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: services = [] } = useQuery({
    queryKey: ["services", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", businessId, dayStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(name), professionals(name), services(name, duration_minutes)")
        .eq("business_id", businessId!)
        .gte("starts_at", dayStart)
        .lte("starts_at", dayEnd)
        .neq("status", "cancelled")
        .order("starts_at");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: typeof form) => {
      const service = services.find((s: any) => s.id === values.service_id);
      if (!service) throw new Error("Serviço não encontrado");
      const startsAt = new Date(`${values.date}T${values.time}`);
      const endsAt = addMinutes(startsAt, service.duration_minutes);
      const { error } = await supabase.from("appointments").insert({
        business_id: businessId!,
        client_id: values.client_id,
        professional_id: values.professional_id,
        service_id: values.service_id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setDialogOpen(false);
      setForm({ client_id: "", professional_id: "", service_id: "", date: "", time: "" });
      toast({ title: "Agendamento criado" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes("Conflito") ? e.message : "Erro ao criar agendamento. Verifique se não há conflito de horário.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "scheduled" | "confirmed" | "done" | "cancelled" }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });

  const getEventsForProfessional = (profId: string, hour: string) => {
    return appointments.filter((a: any) => {
      const aHour = format(new Date(a.starts_at), "HH:00");
      return a.professional_id === profId && aHour === hour;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os horários dos profissionais</p>
        </div>
        <Button variant="emerald" size="sm" onClick={() => {
          setForm({ ...form, date: format(currentDate, "yyyy-MM-dd") });
          setDialogOpen(true);
        }}>
          <Plus className="h-4 w-4" /> Novo agendamento
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => setCurrentDate(subDays(currentDate, 1))} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-sm font-semibold text-foreground">
          {format(currentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {professionals.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Cadastre profissionais para usar a agenda.</div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `60px repeat(${professionals.length}, 1fr)` }}>
            <div className="p-3 border-r border-border"><Clock className="h-4 w-4 text-muted-foreground" /></div>
            {professionals.map((p: any) => (
              <div key={p.id} className="p-3 text-center border-r border-border last:border-r-0">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center mx-auto mb-1">
                  <span className="text-xs font-semibold text-muted-foreground">{p.name[0]}</span>
                </div>
                <span className="text-xs font-medium text-foreground">{p.name}</span>
              </div>
            ))}
          </div>
          {hours.map((hour) => (
            <div key={hour} className="grid border-b border-border last:border-b-0" style={{ gridTemplateColumns: `60px repeat(${professionals.length}, 1fr)` }}>
              <div className="px-3 py-4 border-r border-border">
                <span className="text-xs text-muted-foreground">{hour}</span>
              </div>
              {professionals.map((p: any) => {
                const events = getEventsForProfessional(p.id, hour);
                return (
                  <div key={p.id} className="px-1 py-1 border-r border-border last:border-r-0 min-h-[56px]">
                    {events.map((event: any) => (
                      <button
                        key={event.id}
                        onClick={() => {
                          const next = event.status === "scheduled" ? "confirmed" : event.status === "confirmed" ? "done" : event.status;
                          if (next !== event.status) updateStatus.mutate({ id: event.id, status: next as any });
                        }}
                        className={`w-full rounded-md bg-secondary/60 border-l-2 ${statusColors[event.status] || "border-l-border"} px-2.5 py-2 text-left hover:bg-secondary transition-colors`}
                      >
                        <p className="text-xs font-medium text-foreground truncate">{event.clients?.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{event.services?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{statusLabels[event.status]}</p>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Novo agendamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Profissional</Label>
              <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {professionals.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Servico</Label>
              <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {services.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-background border-border text-foreground" required />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Horario</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="bg-background border-border text-foreground" required />
              </div>
            </div>
            <Button type="submit" variant="emerald" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar agendamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
