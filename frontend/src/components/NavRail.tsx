export function NavRail() {
  return (
    <nav
      className="flex flex-row items-center gap-4 border-b px-4 py-3 md:flex-col md:justify-start md:border-b-0 md:border-r md:px-0 md:py-6 md:w-16"
      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
      aria-label="Primary"
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-sm font-display text-sm font-semibold"
        style={{ backgroundColor: "var(--color-accent-live)", color: "var(--color-bg-base)" }}
        aria-hidden="true"
      >
        AP
      </div>
      <span className="font-display text-sm font-medium md:hidden">AutoPitch</span>
      <div className="ml-auto flex items-center gap-3 md:ml-0 md:mt-4 md:flex-col">
        <NavIcon label="Dashboard" active />
        <NavIcon label="Settings" />
      </div>
    </nav>
  );
}

function NavIcon({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      title={label}
      aria-current={active ? "page" : undefined}
      className="flex h-9 w-9 items-center justify-center rounded-sm text-xs font-mono transition-colors"
      style={{
        color: active ? "var(--color-accent-live)" : "var(--color-text-tertiary)",
        backgroundColor: active ? "var(--color-bg-hover)" : "transparent",
      }}
    >
      {label.slice(0, 2).toUpperCase()}
    </button>
  );
}
