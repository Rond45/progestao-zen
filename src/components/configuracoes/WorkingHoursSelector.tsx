import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const DAYS = [
  { key: "seg", label: "Seg" },
  { key: "ter", label: "Ter" },
  { key: "qua", label: "Qua" },
  { key: "qui", label: "Qui" },
  { key: "sex", label: "Sex" },
  { key: "sab", label: "Sáb" },
  { key: "dom", label: "Dom" },
];

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

export interface DaySchedule {
  enabled: boolean;
  open: string;
  close: string;
}

export type WeekSchedule = Record<string, DaySchedule>;

const DEFAULT_SCHEDULE: WeekSchedule = {
  seg: { enabled: true, open: "09:00", close: "19:00" },
  ter: { enabled: true, open: "09:00", close: "19:00" },
  qua: { enabled: true, open: "09:00", close: "19:00" },
  qui: { enabled: true, open: "09:00", close: "19:00" },
  sex: { enabled: true, open: "09:00", close: "19:00" },
  sab: { enabled: true, open: "09:00", close: "17:00" },
  dom: { enabled: false, open: "09:00", close: "17:00" },
};

export function parseScheduleText(text: string): WeekSchedule {
  const schedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)) as WeekSchedule;
  if (!text) return schedule;

  const lower = text.toLowerCase();
  for (const day of DAYS) {
    const key = day.key;
    // Check if day is mentioned as "fechado"
    const dayRegex = new RegExp(`${key}[^,]*fechado`, "i");
    if (dayRegex.test(lower)) {
      schedule[key].enabled = false;
      continue;
    }
    // Try to find time for this day
    const timeRegex = new RegExp(`${key}[^:]*:\\s*(\\d{1,2})h?\\s*-\\s*(\\d{1,2})h?`, "i");
    const match = lower.match(timeRegex);
    if (match) {
      schedule[key].enabled = true;
      schedule[key].open = `${match[1].padStart(2, "0")}:00`;
      schedule[key].close = `${match[2].padStart(2, "0")}:00`;
    }
  }
  return schedule;
}

export function scheduleToText(schedule: WeekSchedule): string {
  const parts: string[] = [];
  const enabled = DAYS.filter((d) => schedule[d.key]?.enabled);
  const disabled = DAYS.filter((d) => !schedule[d.key]?.enabled);

  // Group consecutive days with same hours
  let i = 0;
  while (i < enabled.length) {
    const start = enabled[i];
    const open = schedule[start.key].open;
    const close = schedule[start.key].close;
    let j = i;
    while (
      j + 1 < enabled.length &&
      schedule[enabled[j + 1].key].open === open &&
      schedule[enabled[j + 1].key].close === close
    ) {
      j++;
    }
    const openH = open.replace(":00", "h").replace(":30", "h30");
    const closeH = close.replace(":00", "h").replace(":30", "h30");
    if (j > i) {
      parts.push(`${start.label}-${enabled[j].label}: ${openH}-${closeH}`);
    } else {
      parts.push(`${start.label}: ${openH}-${closeH}`);
    }
    i = j + 1;
  }

  for (const d of disabled) {
    parts.push(`${d.label}: Fechado`);
  }

  return parts.join(", ");
}

interface Props {
  schedule: WeekSchedule;
  onChange: (schedule: WeekSchedule) => void;
}

export function getDefaultSchedule(): WeekSchedule {
  return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
}

const WorkingHoursSelector = ({ schedule, onChange }: Props) => {
  const updateDay = (key: string, updates: Partial<DaySchedule>) => {
    onChange({ ...schedule, [key]: { ...schedule[key], ...updates } });
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day) => {
        const dayData = schedule[day.key] || { enabled: false, open: "09:00", close: "19:00" };
        return (
          <div key={day.key} className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 w-20">
              <Checkbox
                checked={dayData.enabled}
                onCheckedChange={(checked) => updateDay(day.key, { enabled: !!checked })}
              />
              <Label className="text-sm font-medium text-foreground cursor-pointer">
                {day.label}
              </Label>
            </div>

            {dayData.enabled ? (
              <div className="flex items-center gap-2">
                <Select
                  value={dayData.open}
                  onValueChange={(v) => updateDay(day.key, { open: v })}
                >
                  <SelectTrigger className="w-24 h-8 text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground text-xs">até</span>
                <Select
                  value={dayData.close}
                  onValueChange={(v) => updateDay(day.key, { close: v })}
                >
                  <SelectTrigger className="w-24 h-8 text-xs bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Fechado</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WorkingHoursSelector;
