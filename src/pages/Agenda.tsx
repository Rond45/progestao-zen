import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Plus, Clock, XCircle, RotateCcw, CheckCircle2 } from "lucide-react";
import { useBusiness } from "@/hooks/useBusiness";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, subDays, startOfDay, endOfDay, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

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
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", professional_id: "", service_id: "", date: "", time: "" });

  // Action dialogs
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  const dayStart = startOfDay(currentDate).toISOString();
  const dayEnd = endOfDay(currentDate).toISOString();

  const { data: professionals = [] } = useQuery({
    queryKey: ["professionals", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals").select("*").eq("business_id", businessId!).eq("active", true).order("name");
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
      const { data, error } = await supabase
        .from("services").select("*").eq("business_id", businessId!).eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", businessId, dayStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(id, name, phone, avatar_url), professionals(name), services(name, duration_minutes, price_cents)")
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
      if (!service) throw new Error("Servico nao encontrado");
      const startsAt = new Date(`${values.date}T${values.time}`);
      const endsAt = addMinutes(startsAt, service.duration_minutes);
      const { error } = await supabase.from("appointments").insert({
        business_id: businessId!, client_id: values.client_id, professional_id: values.professional_id,
        service_id: values.service_id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
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
      toast({ title: "Erro", description: e.message?.includes("Conflito") ? e.message : "Erro ao criar agendamento.", variant: "destructive" });
    },
  });

  // Cancel appointment
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento cancelado" });
    },
  });

  // Reschedule
  const rescheduleMutation = useMutation({
    mutationFn: async ({ appointment, date, time }: { appointment: any; date: Date; time: string }) => {
      const service = services.find((s: any) => s.id === appointment.service_id);
      const duration = service?.duration_minutes || 30;
      const startsAt = new Date(`${format(date, "yyyy-MM-dd")}T${time}`);
      const endsAt = addMinutes(startsAt, duration);
      // Cancel old
      await supabase.from("appointments").update({ status: "cancelled" as any }).eq("id", appointment.id);
      // Create new
      const { error } = await supabase.from("appointments").insert({
        business_id: businessId!, client_id: appointment.client_id, professional_id: appointment.professional_id,
        service_id: appointment.service_id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setRescheduleOpen(false);
      setSelectedAppointment(null);
      toast({ title: "Reagendamento realizado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Finalize (mark as done) - triggers the handle_appointment_done function automatically
  const finalizeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "done" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["service-executions-all"] });
      toast({ title: "Agendamento finalizado e registrado no financeiro" });
      setFinalizeOpen(false);
      setSelectedAppointment(null);
    },
  });

  const getEventsForProfessional = (profId: string, hour: string) => {
    return appointments.filter((a: any) => {
      const aHour = format(new Date(a.starts_at), "HH:00");
      return a.professional_id === profId && aHour === hour;
    });
  };

  const formatPrice = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os horarios dos profissionais</p>
        </div>
        <Button variant="emerald" size="sm" onClick={() => { setForm({ ...form, date: format(currentDate, "yyyy-MM-dd") }); setDialogOpen(true); }}>
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
              <div className="px-3 py-4 border-r border-border"><span className="text-xs text-muted-foreground">{hour}</span></div>
              {professionals.map((p: any) => {
                const events = getEventsForProfessional(p.id, hour);
                return (
                  <div key={p.id} className="px-1 py-1 border-r border-border last:border-r-0 min-h-[56px]">
                    {events.map((event: any) => (
                      <div key={event.id} className={`w-full rounded-md bg-secondary/60 border-l-2 ${statusColors[event.status] || "border-l-border"} px-2.5 py-2 text-left`}>
                        <button
                          onClick={() => navigate(`/dashboard/clientes/${event.clients?.id}`)}
                          className="text-xs font-medium text-foreground truncate block hover:text-primary transition-colors"
                        >
                          {event.clients?.name}
                        </button>
                        <p className="text-[10px] text-muted-foreground truncate">{event.services?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{statusLabels[event.status]}</p>
                        {event.status !== "done" && event.status !== "cancelled" && (
                          <div className="flex gap-1 mt-1.5">
                            <button
                              onClick={() => cancelMutation.mutate(event.id)}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                              title="Cancelar"
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => { setSelectedAppointment(event); setRescheduleOpen(true); }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                              title="Reagendar"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => { setSelectedAppointment(event); setFinalizeOpen(true); }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title="Finalizar"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* New appointment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo agendamento</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Cliente</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {clients.filter((c: any) => c.id).map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Profissional</Label>
              <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {professionals.filter((p: any) => p.id).map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Servico</Label>
              <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {services.filter((s: any) => s.id).map((s: any) => (<SelectItem key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min)</SelectItem>))}
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

      {/* Reschedule dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={(o) => { setRescheduleOpen(o); if (!o) setSelectedAppointment(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Reagendar</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedAppointment && (
              <div className="text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">{selectedAppointment.clients?.name}</span> - {selectedAppointment.services?.name}</p>
              </div>
            )}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={rescheduleDate}
                onSelect={setRescheduleDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border border-border"
              />
            </div>
            {rescheduleDate && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Horario</Label>
                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className="bg-background border-border text-foreground" required />
              </div>
            )}
            <Button
              variant="emerald"
              className="w-full"
              disabled={!rescheduleDate || !rescheduleTime || rescheduleMutation.isPending}
              onClick={() => {
                if (selectedAppointment && rescheduleDate && rescheduleTime) {
                  rescheduleMutation.mutate({ appointment: selectedAppointment, date: rescheduleDate, time: rescheduleTime });
                }
              }}
            >
              {rescheduleMutation.isPending ? "Reagendando..." : "Confirmar reagendamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finalize dialog */}
      <Dialog open={finalizeOpen} onOpenChange={(o) => { setFinalizeOpen(o); if (!o) setSelectedAppointment(null); }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Finalizar atendimento</DialogTitle></DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {selectedAppointment.clients?.name?.[0] || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedAppointment.clients?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedAppointment.clients?.phone}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Servico</span>
                    <span className="text-foreground">{selectedAppointment.services?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="text-foreground">{selectedAppointment.professionals?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Valor total</span>
                    <span className="text-primary">{formatPrice(selectedAppointment.services?.price_cents || 0)}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="emerald"
                className="w-full"
                onClick={() => finalizeMutation.mutate(selectedAppointment.id)}
                disabled={finalizeMutation.isPending}
              >
                <CheckCircle2 className="h-4 w-4" />
                {finalizeMutation.isPending ? "Finalizando..." : "Pago - Finalizar e registrar no financeiro"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Agenda;
