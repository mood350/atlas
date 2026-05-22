import { Calendar, Video } from "lucide-react";
import { MockupFrame } from "./MockupFrame";

const slots = [
  { hour: "09:00", label: "Briefing kickoff", client: "Yaoundé Tech", color: "var(--primary)" },
  { hour: "11:30", label: "Suivi projet", client: "Dakar Studio", color: "var(--success)" },
  { hour: "14:00", label: "Démo prototype", client: "Bamako Web", color: "var(--warning)" },
  { hour: "16:30", label: "Rétro client", client: "Lomé Digital", color: "var(--info)" },
];

export function CalendarMockup({ className }: { className?: string }) {
  return (
    <MockupFrame variant="browser" className={className}>
      <div className="grid h-[420px] grid-cols-[1fr_180px] gap-3 p-3">
        {/* Calendar grid */}
        <div className="rounded-lg border border-border-soft bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[12px] font-semibold tracking-tight">
              Mai 2025
            </div>
            <Calendar className="h-3.5 w-3.5 text-foreground-muted" />
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[8px] font-semibold uppercase text-foreground-subtle">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2;
              const isToday = day === 12;
              const hasEvent = [4, 8, 12, 15, 19, 22].includes(day);
              return (
                <div
                  key={i}
                  className="flex aspect-square items-center justify-center rounded text-[10px]"
                  style={{
                    backgroundColor: isToday ? "var(--primary)" : undefined,
                    color: isToday
                      ? "white"
                      : day < 1 || day > 31
                      ? "var(--foreground-subtle)"
                      : "var(--foreground)",
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {day > 0 && day <= 31 ? day : ""}
                  {hasEvent && !isToday ? (
                    <span className="absolute mt-3.5 h-1 w-1 rounded-full bg-primary" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's agenda */}
        <div className="rounded-lg border border-border-soft bg-background-soft p-3">
          <div className="caption-14 mb-2 font-semibold text-foreground-subtle">
            Aujourd&apos;hui
          </div>
          <div className="space-y-2">
            {slots.map((s, i) => (
              <div
                key={i}
                className="rounded-md bg-surface p-2 border-l-[3px]"
                style={{ borderLeftColor: s.color }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-foreground">
                    {s.hour}
                  </span>
                  <Video className="h-2.5 w-2.5 text-foreground-subtle" />
                </div>
                <div className="text-[10px] font-medium text-foreground">
                  {s.label}
                </div>
                <div className="text-[9px] text-foreground-subtle">{s.client}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}
