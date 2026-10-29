import { BellRing } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Props {
  businessId: string;
  enabled: boolean;
  hoursBefore: number;
}

const LembretesConfig = ({ businessId, enabled, hoursBefore }: Props) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: usage } = useQuery({
    queryKey: ["reminder-usage", businessId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_my_reminder_usage");
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as { cap: number; sent: number } | undefined;
    },
  });

  const save = useMutation({
    mutationFn: async (patch: { reminders_enabled?: boolean; reminder_hours_before?: number }) => {
      const { error } = await supabase.from("businesses").update(patch).eq("id", businessId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business"] });
      toast({ title: "Lembretes atualizados" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Lembretes automáticos por WhatsApp</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Os lembretes são enviados pelo número do ProGestão+ em nome do seu estabelecimento. O cliente pode confirmar ou cancelar pelo próprio WhatsApp e pode responder SAIR para não receber mais.
      </p>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="reminders-enabled" className="text-sm font-medium text-foreground">Enviar lembretes</Label>
        <Switch
          id="reminders-enabled"
          checked={enabled}
          disabled={save.isPending}
          onCheckedChange={(v) => save.mutate({ reminders_enabled: v })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground">Antecedência</Label>
        <Select
          value={String(hoursBefore)}
          onValueChange={(v) => save.mutate({ reminder_hours_before: Number(v) })}
          disabled={save.isPending}
        >
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2h antes</SelectItem>
            <SelectItem value="4">4h antes</SelectItem>
            <SelectItem value="24">24h antes</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {usage && (
        <p className="text-sm text-foreground">
          Enviados este mês: <span className="font-semibold">{usage.sent}</span> de {usage.cap}
        </p>
      )}
    </div>
  );
};

export default LembretesConfig;
