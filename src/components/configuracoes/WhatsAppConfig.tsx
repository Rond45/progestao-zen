import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Bot, CheckCircle, Clock, Info, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import WorkingHoursSelector, {
  type WeekSchedule,
  getDefaultSchedule,
  parseScheduleText,
  scheduleToText,
} from "./WorkingHoursSelector";

interface Props {
  businessId: string | null;
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const WhatsAppConfig = ({ businessId }: Props) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: connection, isLoading } = useQuery({
    queryKey: ["whatsapp-connection", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_connections")
        .select("*")
        .eq("business_id", businessId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  // Fetch business data
  const { data: business } = useQuery({
    queryKey: ["business", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", businessId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  // Fetch services for auto-populate
  const { data: services } = useQuery({
    queryKey: ["services", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("name, price_cents, active")
        .eq("business_id", businessId!)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const [form, setForm] = useState({
    ai_name: "",
    phone_number: "",
    services_info: "",
  });
  const [schedule, setSchedule] = useState<WeekSchedule>(getDefaultSchedule());
  const [wasAutoPopulated, setWasAutoPopulated] = useState(false);

  const formatServicesText = () => {
    if (!services || services.length === 0) return "";
    return services
      .map((s) => `${s.name} - R$ ${(s.price_cents / 100).toFixed(2).replace(".", ",")}`)
      .join(", ");
  };

  const formatBusinessHours = () => {
    if (!business) return "";
    const open = business.opening_time?.slice(0, 5) || "09:00";
    const close = business.closing_time?.slice(0, 5) || "19:00";
    return `Seg-Sex: ${open.replace(":", "h")}-${close.replace(":", "h")}`;
  };

  useEffect(() => {
    if (connection) {
      setForm({
        ai_name: connection.ai_name || "",
        phone_number: connection.phone_number || "",
        services_info: connection.services_info || "",
      });
      if (connection.working_hours) {
        setSchedule(parseScheduleText(connection.working_hours));
      }
      setWasAutoPopulated(false);
    } else if (business && !connection) {
      // Auto-populate from business data
      const autoServices = formatServicesText();
      const autoHours = formatBusinessHours();
      setForm((prev) => ({
        ...prev,
        services_info: autoServices || prev.services_info,
      }));
      if (autoHours) {
        setSchedule(parseScheduleText(autoHours));
      }
      if (autoServices || autoHours) {
        setWasAutoPopulated(true);
      }
    }
  }, [connection, business, services]);

  const syncFromBusiness = () => {
    const autoServices = formatServicesText();
    if (autoServices) setForm((prev) => ({ ...prev, services_info: autoServices }));
    if (business) {
      const open = business.opening_time?.slice(0, 5) || "09:00";
      const close = business.closing_time?.slice(0, 5) || "19:00";
      const text = `Seg-Sex: ${open.replace(":", "h")}-${close.replace(":", "h")}`;
      setSchedule(parseScheduleText(text));
    }
    toast({ title: "Dados sincronizados das configurações gerais!" });
    setWasAutoPopulated(true);
  };

  const saveConfig = useMutation({
    mutationFn: async () => {
      const payload = {
        ai_name: form.ai_name,
        phone_number: form.phone_number.replace(/\D/g, ""),
        working_hours: scheduleToText(schedule),
        services_info: form.services_info,
        updated_at: new Date().toISOString(),
      };
      if (connection) {
        const { error } = await supabase
          .from("whatsapp_connections")
          .update(payload)
          .eq("business_id", businessId!);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_connections")
          .insert({ ...payload, business_id: businessId! } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-connection"] });
      toast({ title: "Configurações salvas com sucesso!" });
      setWasAutoPopulated(false);
    },
    onError: (e: any) =>
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  const isConnected = connection?.status === "connected";

  if (isLoading)
    return <div className="text-sm text-muted-foreground py-4">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-base font-semibold text-foreground">
              Configurações do WhatsApp IA
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={syncFromBusiness}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Sincronizar com configurações
          </Button>
        </div>

        {wasAutoPopulated && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-md bg-primary/10 border border-primary/20">
            <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-foreground">
              Esses dados foram importados das suas configurações. Você pode editar antes de salvar.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {/* Nome da atendente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Nome da sua atendente virtual
            </Label>
            <Input
              placeholder="Ex: Ana, Julia, Carol..."
              value={form.ai_name}
              onChange={(e) => setForm({ ...form, ai_name: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Esse é o nome com que a IA irá se apresentar aos seus clientes.
            </p>
          </div>

          {/* Número de WhatsApp */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Número de WhatsApp para atendimento
            </Label>
            <Input
              placeholder="(11) 99999-9999"
              value={formatPhone(form.phone_number)}
              onChange={(e) =>
                setForm({ ...form, phone_number: e.target.value.replace(/\D/g, "") })
              }
            />
            <p className="text-xs text-muted-foreground">
              Número exclusivo para atendimento. Não use seu número pessoal.
            </p>
          </div>

          {/* Horário de funcionamento */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Horário de funcionamento
            </Label>
            <WorkingHoursSelector schedule={schedule} onChange={setSchedule} />
          </div>

          {/* Serviços e preços */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Serviços e preços</Label>
            <Textarea
              placeholder="Liste seus serviços com preços. Ex: Corte masculino - R$ 45,00, Barba - R$ 30,00..."
              value={form.services_info}
              onChange={(e) => setForm({ ...form, services_info: e.target.value })}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              A IA usará essas informações para responder dúvidas dos clientes.
            </p>
          </div>

          {/* Status de conexão */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium text-foreground">Status da conexão</Label>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-3.5 w-3.5" />
                WhatsApp conectado ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                <Clock className="h-3.5 w-3.5" />
                Aguardando ativação
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              A ativação é feita pela equipe ProGestão+ em até 24h após o cadastro.
            </p>
          </div>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => saveConfig.mutate()}
            disabled={saveConfig.isPending}
            className="mt-2"
          >
            {saveConfig.isPending ? "Salvando..." : "Salvar configurações"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
