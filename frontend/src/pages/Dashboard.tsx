import { useEffect, useState } from "react";
import { api, type Campaign, type Lead } from "../lib/api";
import { NavRail } from "../components/NavRail";
import { TelemetryStrip } from "../components/TelemetryStrip";
import { LeadTable } from "../components/LeadTable";
import { LeadDetailDrawer } from "../components/LeadDetailDrawer";

export function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listCampaigns()
      .then((cs) => {
        setCampaigns(cs);
        if (cs.length > 0) setCampaignId(cs[0].id);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to reach AutoPitch API");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!campaignId) return;
    api.listLeads(campaignId).then(setLeads).catch(() => setLeads([]));
  }, [campaignId]);

  function handleUpdated(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelected(updated);
  }

  return (
    <div className="flex h-svh flex-col md:flex-row" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <NavRail />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <h1 className="font-display text-xl font-semibold">Mission Control</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {campaigns.find((c) => c.id === campaignId)?.product_name ?? "No campaign selected"}
            </p>
          </div>
          {campaigns.length > 1 && (
            <select
              value={campaignId ?? ""}
              onChange={(e) => setCampaignId(e.target.value)}
              className="rounded-sm border px-2 py-1 font-mono text-xs"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.product_name}
                </option>
              ))}
            </select>
          )}
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center font-mono text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            connecting…
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <p className="font-mono text-sm" style={{ color: "var(--color-status-failed)" }}>
              {error}
              <br />
              Is the backend running at the configured VITE_API_URL?
            </p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-1 items-center justify-center font-mono text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            No campaigns yet. Create one via the API to get started.
          </div>
        ) : (
          <>
            <TelemetryStrip leads={leads} />
            <LeadTable leads={leads} selectedId={selected?.id ?? null} onSelect={setSelected} />
          </>
        )}
      </div>

      {selected && (
        <LeadDetailDrawer lead={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}
    </div>
  );
}
