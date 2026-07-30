import type { Lead, LeadStatus } from "../lib/api";

const GROUPS: { key: LeadStatus[]; label: string; color: string; pulsing?: boolean }[] = [
  { key: ["queued"], label: "Queued", color: "var(--color-status-queued)" },
  { key: ["researching"], label: "In Flight", color: "var(--color-accent-live)", pulsing: true },
  { key: ["researched", "drafted"], label: "Drafted", color: "var(--color-status-drafted)" },
  { key: ["needs_review"], label: "Needs Review", color: "var(--color-status-review)" },
  { key: ["sent"], label: "Sent", color: "var(--color-status-sent)" },
  { key: ["replied"], label: "Signals Received", color: "var(--color-accent-success)" },
  { key: ["failed"], label: "Failed", color: "var(--color-status-failed)" },
];

export function TelemetryStrip({ leads }: { leads: Lead[] }) {
  return (
    <div
      className="flex flex-wrap items-center gap-x-8 gap-y-2 border-b px-6 py-3"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
    >
      {GROUPS.map((group) => {
        const count = leads.filter((l) => group.key.includes(l.status)).length;
        return (
          <div key={group.label} className="flex items-baseline gap-2">
            {group.pulsing && count > 0 && (
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot"
                style={{ backgroundColor: group.color }}
                aria-hidden="true"
              />
            )}
            <span className="font-mono text-xl font-medium" style={{ color: group.color }}>
              {String(count).padStart(2, "0")}
            </span>
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {group.label}
            </span>
          </div>
        );
      })}
      <div className="ml-auto flex items-center gap-2 font-mono text-xs" style={{ color: "var(--color-text-tertiary)" }}>
        <span className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: "var(--color-accent-live)" }} />
        LIVE
      </div>
    </div>
  );
}
