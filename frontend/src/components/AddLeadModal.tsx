import { useRef, useState, type FormEvent } from "react";
import { api, type Lead } from "../lib/api";

export function AddLeadModal({
  campaignId,
  onClose,
  onAdded,
}: {
  campaignId: string;
  onClose: () => void;
  onAdded: (leads: Lead[]) => void;
}) {
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [companyName, setCompanyName] = useState("");
  const [founderName, setFounderName] = useState("");
  const [email, setEmail] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const lead = await api.createLead({
        campaign_id: campaignId,
        company_name: companyName,
        founder_name: founderName,
        email,
        company_url: companyUrl,
      });
      onAdded([lead]);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add lead");
    } finally {
      setBusy(false);
    }
  }

  async function handleCsvSubmit(e: FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const leads = await api.uploadLeadsCsv(campaignId, file);
      onAdded(leads);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "CSV upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="presentation">
      <div
        className="w-full max-w-md rounded-sm border p-6"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-elevated)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add lead"
      >
        <h2 className="font-display text-lg font-semibold">Track New Lead(s)</h2>

        <div className="mt-4 mb-5 flex gap-1 rounded-sm border p-0.5" style={{ borderColor: "var(--color-border)" }}>
          {(["manual", "csv"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className="flex-1 rounded-sm py-1.5 font-mono text-xs transition-colors"
              style={{
                backgroundColor: mode === m ? "var(--color-bg-hover)" : "transparent",
                color: mode === m ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              }}
            >
              {m === "manual" ? "Manual" : "CSV Upload"}
            </button>
          ))}
        </div>

        {mode === "manual" ? (
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
            <Field label="Company name">
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>
            <Field label="Founder name">
              <input
                required
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>
            <Field label="Company URL">
              <input
                required
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://theircompany.com"
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>

            {error && (
              <p className="text-sm" style={{ color: "var(--color-status-failed)" }}>
                {error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border px-3 py-1.5 font-mono text-xs"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-sm border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
                style={{
                  borderColor: "var(--color-accent-live)",
                  backgroundColor: "var(--color-accent-live-dim)",
                  color: "var(--color-accent-live)",
                }}
              >
                {busy ? "…" : "Add Lead"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCsvSubmit} className="flex flex-col gap-3">
            <Field label="CSV file (company_name, founder_name, email, company_url)">
              <input
                ref={fileInputRef}
                required
                type="file"
                accept=".csv"
                className="mt-1 w-full rounded-sm border px-3 py-2 text-sm outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}
              />
            </Field>

            {error && (
              <p className="text-sm" style={{ color: "var(--color-status-failed)" }}>
                {error}
              </p>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-sm border px-3 py-1.5 font-mono text-xs"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-sm border px-3 py-1.5 font-mono text-xs disabled:opacity-40"
                style={{
                  borderColor: "var(--color-accent-live)",
                  backgroundColor: "var(--color-accent-live-dim)",
                  color: "var(--color-accent-live)",
                }}
              >
                {busy ? "…" : "Upload"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
        {label}
      </span>
      {children}
    </label>
  );
}
