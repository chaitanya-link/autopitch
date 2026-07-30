import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { api, type Campaign, type Lead } from "../lib/api";
import { NavRail } from "../components/NavRail";
import { TelemetryStrip } from "../components/TelemetryStrip";
import { LeadTable } from "../components/LeadTable";
import { LeadDetailDrawer } from "../components/LeadDetailDrawer";
import { CreateCampaignModal } from "../components/CreateCampaignModal";
import { AddLeadModal } from "../components/AddLeadModal";

const SIGNAL_POLL_INTERVAL_MS = 20000;
const FLASH_DURATION_MS = 2500;

export function Dashboard({ session }: { session: Session }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [justReplied, setJustReplied] = useState<Set<string>>(new Set());
  const [checkingSignals, setCheckingSignals] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);

  const loadCampaigns = useCallback((selectId?: string) => {
    return api
      .listCampaigns()
      .then((cs) => {
        setCampaigns(cs);
        if (selectId) {
          setCampaignId(selectId);
        } else {
          setCampaignId((prev) => (prev && cs.some((c) => c.id === prev) ? prev : (cs[0]?.id ?? null)));
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to reach AutoPitch API");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const applyLeadsUpdate = useCallback((newLeads: Lead[]) => {
    setLeads((prevLeads) => {
      const prevStatus = new Map(prevLeads.map((l) => [l.id, l.status]));
      const newlyReplied = newLeads
        .filter((l) => l.status === "replied" && prevStatus.get(l.id) !== "replied")
        .map((l) => l.id);
      if (newlyReplied.length > 0) {
        setJustReplied(new Set(newlyReplied));
        setTimeout(() => setJustReplied(new Set()), FLASH_DURATION_MS);
      }
      return newLeads;
    });
  }, []);

  const refreshLeads = useCallback(
    async (id: string) => {
      try {
        applyLeadsUpdate(await api.listLeads(id));
      } catch {
        // transient poll failure, keep showing last known state
      }
    },
    [applyLeadsUpdate],
  );

  const pollSignals = useCallback(
    async (id: string) => {
      try {
        await api.checkReplies(id);
      } catch {
        // reply check unavailable this cycle; still refresh in case something changed
      }
      await refreshLeads(id);
    },
    [refreshLeads],
  );

  useEffect(() => {
    if (!campaignId) return;
    refreshLeads(campaignId);
    const interval = setInterval(() => pollSignals(campaignId), SIGNAL_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [campaignId, refreshLeads, pollSignals]);

  async function handleCheckSignals() {
    if (!campaignId) return;
    setCheckingSignals(true);
    await pollSignals(campaignId);
    setCheckingSignals(false);
  }

  function handleUpdated(updated: Lead) {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    setSelected(updated);
  }

  return (
    <div className="flex h-svh flex-col md:flex-row" style={{ backgroundColor: "var(--color-bg-base)" }}>
      <NavRail userEmail={session.user.email} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <h1 className="font-display text-xl font-semibold">Mission Control</h1>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {campaigns.find((c) => c.id === campaignId)?.product_name ?? "No campaign selected"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {campaignId && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddLead(true)}
                  className="rounded-sm border px-2.5 py-1 font-mono text-xs transition-colors"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  + Add Lead
                </button>
                <button
                  type="button"
                  onClick={handleCheckSignals}
                  disabled={checkingSignals}
                  className="rounded-sm border px-2.5 py-1 font-mono text-xs transition-colors disabled:opacity-40"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  {checkingSignals ? "checking…" : "Check Signals"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowCreateCampaign(true)}
              className="rounded-sm border px-2.5 py-1 font-mono text-xs transition-colors"
              style={{
                borderColor: "var(--color-accent-live)",
                color: "var(--color-accent-live)",
              }}
            >
              + New Campaign
            </button>
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
          </div>
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
          <div className="flex flex-1 flex-col items-center justify-center gap-3 font-mono text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            <p>No campaigns yet.</p>
            <button
              type="button"
              onClick={() => setShowCreateCampaign(true)}
              className="rounded-sm border px-3 py-1.5 font-mono text-xs"
              style={{
                borderColor: "var(--color-accent-live)",
                backgroundColor: "var(--color-accent-live-dim)",
                color: "var(--color-accent-live)",
              }}
            >
              + New Campaign
            </button>
          </div>
        ) : (
          <>
            <TelemetryStrip leads={leads} />
            {leads.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 font-mono text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                <p>No leads tracked in this campaign yet.</p>
                <button
                  type="button"
                  onClick={() => setShowAddLead(true)}
                  className="rounded-sm border px-3 py-1.5 font-mono text-xs"
                  style={{
                    borderColor: "var(--color-accent-live)",
                    backgroundColor: "var(--color-accent-live-dim)",
                    color: "var(--color-accent-live)",
                  }}
                >
                  + Add Lead
                </button>
              </div>
            ) : (
              <LeadTable
                leads={leads}
                selectedId={selected?.id ?? null}
                onSelect={setSelected}
                justRepliedIds={justReplied}
              />
            )}
          </>
        )}
      </div>

      {selected && (
        <LeadDetailDrawer lead={selected} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
      )}

      {showCreateCampaign && (
        <CreateCampaignModal
          onClose={() => setShowCreateCampaign(false)}
          onCreated={(c) => loadCampaigns(c.id)}
        />
      )}

      {showAddLead && campaignId && (
        <AddLeadModal
          campaignId={campaignId}
          onClose={() => setShowAddLead(false)}
          onAdded={() => refreshLeads(campaignId)}
        />
      )}
    </div>
  );
}
