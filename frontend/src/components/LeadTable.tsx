import type { Lead } from "../lib/api";
import { StatusChip } from "./StatusChip";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function LeadTable({
  leads,
  selectedId,
  onSelect,
  justRepliedIds,
}: {
  leads: Lead[];
  selectedId: string | null;
  onSelect: (lead: Lead) => void;
  justRepliedIds?: Set<string>;
}) {
  if (leads.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center font-mono text-sm"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        No leads tracked yet.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr
            className="sticky top-0 border-b text-xs uppercase tracking-wider"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-tertiary)" }}
          >
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Company</th>
            <th className="px-4 py-2 font-medium hidden sm:table-cell">Founder</th>
            <th className="px-4 py-2 font-medium hidden md:table-cell">Email</th>
            <th className="px-4 py-2 font-medium text-right hidden sm:table-cell">Confidence</th>
            <th className="px-4 py-2 font-medium text-right hidden lg:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onSelect(lead)}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(lead)}
              className={`cursor-pointer border-b transition-colors focus-visible:outline-none ${
                justRepliedIds?.has(lead.id) ? "animate-flash-once" : ""
              }`}
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: selectedId === lead.id ? "var(--color-bg-hover)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (selectedId !== lead.id) e.currentTarget.style.backgroundColor = "var(--color-bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (selectedId !== lead.id) e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <td className="px-4 py-2.5">
                <StatusChip status={lead.status} />
              </td>
              <td className="px-4 py-2.5 font-medium">{lead.company_name}</td>
              <td
                className="px-4 py-2.5 hidden sm:table-cell"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {lead.founder_name}
              </td>
              <td
                className="px-4 py-2.5 font-mono text-xs hidden md:table-cell"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {lead.email}
              </td>
              <td className="px-4 py-2.5 text-right font-mono text-xs hidden sm:table-cell">
                {lead.confidence_score ? Number(lead.confidence_score).toFixed(2) : "—"}
              </td>
              <td
                className="px-4 py-2.5 text-right font-mono text-xs hidden lg:table-cell"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {relativeTime(lead.updated_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
