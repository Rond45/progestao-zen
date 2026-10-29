import { BellRing, CheckCheck, BellOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Reminder = { status: string; response: string | null };

const ReminderIndicator = ({ reminders }: { reminders?: Reminder[] | null }) => {
  const r = (reminders ?? []).find((x) => x.status === "sent");
  if (!r) return null;
  const cfg =
    r.response === "confirmed"
      ? { Icon: CheckCheck, label: "Confirmado pelo cliente", cls: "text-primary" }
      : r.response === "cancelled"
        ? { Icon: BellOff, label: "Cancelado pelo cliente", cls: "text-destructive" }
        : { Icon: BellRing, label: "Lembrete enviado", cls: "text-muted-foreground" };
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex align-middle ml-1 ${cfg.cls}`} aria-label={cfg.label}>
            <cfg.Icon className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent>{cfg.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReminderIndicator;
