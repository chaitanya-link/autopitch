import type { LeadStatus } from "../lib/api";

interface StatusMeta {
  label: string;
  color: string;
  pulsing: boolean;
}

const STATUS_META: Record<LeadStatus, StatusMeta> = {
  queued: { label: "Queued", color: "var(--color-status-queued)", pulsing: false },
  researching: { label: "Researching", color: "var(--color-accent-live)", pulsing: true },
  researched: { label: "Researched", color: "var(--color-status-researched)", pulsing: false },
  drafted: { label: "Drafted", color: "var(--color-status-drafted)", pulsing: false },
  needs_review: { label: "Needs Review", color: "var(--color-status-review)", pulsing: false },
  sent: { label: "Sent", color: "var(--color-status-sent)", pulsing: false },
  replied: { label: "Signal Received", color: "var(--color-accent-success)", pulsing: false },
  failed: { label: "Failed", color: "var(--color-status-failed)", pulsing: false },
};

export function StatusChip({ status }: { status: LeadStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-xs tracking-wide"
      style={{ borderColor: "var(--color-border)", color: meta.color }}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${meta.pulsing ? "animate-pulse-dot" : ""}`}
        style={{ backgroundColor: meta.color }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  );
}

export { STATUS_META };
