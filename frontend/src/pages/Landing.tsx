import { useRef, useState } from "react";

const PIPELINE_LAYERS = [
  {
    step: "01",
    title: "Scrape",
    color: "var(--color-accent-live)",
    pulsing: true,
    tech: "Fetches the lead's site, honoring robots.txt, with graceful failure handling on dead or blocked domains.",
  },
  {
    step: "02",
    title: "RAG",
    color: "var(--color-status-researched)",
    pulsing: false,
    tech: "Chunks the page, embeds each chunk with Gemini (768-dim), and retrieves the top-k most relevant passages via pgvector cosine similarity.",
  },
  {
    step: "03",
    title: "Draft",
    color: "var(--color-status-drafted)",
    pulsing: false,
    tech: "Gemini cross-references the retrieved context against your product and returns structured JSON — subject, body, confidence.",
  },
  {
    step: "04",
    title: "Verify",
    color: "var(--color-status-review)",
    pulsing: false,
    tech: "A confidence threshold gates auto-send. Thin research routes to human review instead of a guessed personalization.",
  },
  {
    step: "05",
    title: "Send",
    color: "var(--color-status-sent)",
    pulsing: false,
    tech: "SMTP dispatch with a per-campaign pacing interval and a hard daily cap — never a burst.",
  },
  {
    step: "06",
    title: "Reply",
    color: "var(--color-accent-success)",
    pulsing: false,
    tech: "Polls the inbox via IMAP, matching In-Reply-To / References headers back to the original Message-ID.",
  },
];

const USE_CASES = [
  "SaaS founders doing investor outreach",
  "Recruiters sourcing candidates at scale",
  "Sales teams running personalized cold email",
  "Agencies pitching new clients",
  "Freelancers finding new leads",
  "Startups doing partnership outreach",
  "Consultants building a pipeline",
  "Indie hackers validating a new product",
];

const FAQS = [
  {
    q: "Does it actually personalize each email, or is this a mail-merge?",
    a: "It's not templating. The agent scrapes and embeds each lead's own site, retrieves the most relevant chunks, and has an LLM write a specific opening line grounded in that content — then scores its own confidence in how genuine the personalization is.",
  },
  {
    q: "What happens if the agent isn't confident about a lead?",
    a: "It doesn't guess. Below the confidence threshold, the lead is flagged \"Needs Review\" instead of drafted normally, and a human decides whether to send, edit, or skip it.",
  },
  {
    q: "Which LLM powers the research and drafting?",
    a: "Google Gemini for both embeddings (retrieval) and drafting (structured JSON output with a confidence score and reasoning attached).",
  },
  {
    q: "Do I need to use my own Gmail account?",
    a: "Yes — sending and reply detection run through a Gmail account you control via an App Password. Nothing is sent through a third-party mail relay.",
  },
  {
    q: "How does reply detection work?",
    a: "It polls your inbox via IMAP and matches the In-Reply-To / References headers on incoming mail against the Message-ID of what was sent — the same mechanism real email clients use for threading.",
  },
  {
    q: "Is my data secure?",
    a: "Every API route is gated behind Supabase Auth and scoped to your own campaigns and leads — nobody else's data is reachable through your session, and secrets never ship to the browser.",
  },
];

export function Landing({ onSignIn }: { onSignIn: () => void }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg-base)", color: "var(--color-text-primary)" }}>
      <nav className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-sm font-display text-xs font-semibold"
            style={{ backgroundColor: "var(--color-accent-live)", color: "var(--color-bg-base)" }}
            aria-hidden="true"
          >
            AP
          </div>
          <span className="font-display text-sm font-semibold">AutoPitch</span>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors"
          style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero: headline + CTA on the left, the live pipeline diagram on the right — visible without scrolling */}
      <div ref={heroRef} onMouseMove={handleMouseMove} className="hero-spotlight relative overflow-hidden px-6 py-14 md:px-10 md:py-20">
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-sm border px-3 py-1 font-mono text-xs"
              style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-dot"
                style={{ backgroundColor: "var(--color-accent-live)" }}
                aria-hidden="true"
              />
              Agent pipeline, not a mail-merge
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight md:text-5xl xl:text-6xl">
              Outreach that researches
              <br />
              <span style={{ color: "var(--color-accent-live)" }}>before it ever writes.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base md:text-lg" style={{ color: "var(--color-text-secondary)" }}>
              AutoPitch reads each lead's own site with RAG, cross-references it against your product, and drafts a
              genuinely personal email — flagging anything it isn't confident about instead of guessing.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSignIn}
                className="rounded-sm border px-5 py-2.5 font-mono text-sm transition-colors"
                style={{
                  borderColor: "var(--color-accent-live)",
                  backgroundColor: "var(--color-accent-live-dim)",
                  color: "var(--color-accent-live)",
                }}
              >
                Sign In / Get Started
              </button>
              <a
                href="#faq"
                className="rounded-sm border px-5 py-2.5 font-mono text-sm transition-colors"
                style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
              >
                Questions?
              </a>
            </div>
          </div>

          {/* Layer diagram — the signature visual, same status-color language as the dashboard */}
          <div
            className="relative rounded-sm border p-5"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <div className="mb-4 font-mono text-xs uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>
              Live pipeline
            </div>
            <div className="relative flex flex-col gap-3">
              <div
                className="absolute bottom-4 left-[15px] top-4 w-px"
                style={{ backgroundColor: "var(--color-border)" }}
                aria-hidden="true"
              />
              {PIPELINE_LAYERS.map((layer) => (
                <div key={layer.step} className="relative flex gap-4 rounded-sm p-2">
                  <div
                    className={`relative z-10 mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 ${
                      layer.pulsing ? "animate-pulse-dot" : ""
                    }`}
                    style={{ borderColor: layer.color, backgroundColor: "var(--color-bg-surface)" }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: layer.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
                        {layer.step}
                      </span>
                      <h3 className="font-display text-sm font-semibold">{layer.title}</h3>
                    </div>
                    <p className="mt-0.5 text-xs leading-snug" style={{ color: "var(--color-text-secondary)" }}>
                      {layer.tech}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marquee — where AutoPitch fits */}
      <section className="border-y py-8" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}>
        <p
          className="mb-5 px-6 text-center font-mono text-xs uppercase tracking-wider md:px-10"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Where it fits
        </p>
        <div className="marquee-wrap overflow-hidden">
          <div className="marquee-track">
            {[...USE_CASES, ...USE_CASES].map((useCase, i) => (
              <div
                key={i}
                className="mx-2 flex-none whitespace-nowrap rounded-sm border px-4 py-2 font-mono text-sm"
                style={{ borderColor: "var(--color-border-strong)", color: "var(--color-text-secondary)" }}
              >
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-2xl px-6 py-24 md:px-10">
        <h2 className="text-center font-display text-2xl font-semibold md:text-3xl">Frequently asked</h2>
        <div className="mt-10 flex flex-col gap-2">
          {FAQS.map((item, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={item.q} className="rounded-sm border" style={{ borderColor: "var(--color-border)" }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
                >
                  <span className="font-medium text-sm md:text-base">{item.q}</span>
                  <span className="font-mono text-lg" style={{ color: "var(--color-accent-live)" }} aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact CTA */}
      <section
        className="mx-6 mb-24 rounded-sm border p-8 text-center md:mx-10 md:p-14"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg-surface)" }}
      >
        <h2 className="font-display text-2xl font-semibold md:text-3xl">Is your lead-gen team struggling?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm md:text-base" style={{ color: "var(--color-text-secondary)" }}>
          I built AutoPitch end to end — RAG pipeline, drafting agent, sending, reply detection. Happy to customize
          it for your team's outreach.
        </p>
        <a
          href="mailto:chaitanyanjoshi25@gmail.com"
          className="mt-6 inline-block rounded-sm border px-5 py-2.5 font-mono text-sm transition-colors"
          style={{
            borderColor: "var(--color-accent-live)",
            backgroundColor: "var(--color-accent-live-dim)",
            color: "var(--color-accent-live)",
          }}
        >
          chaitanyanjoshi25@gmail.com
        </a>
      </section>

      <footer
        className="flex flex-col items-center gap-2 border-t px-6 py-8 text-center font-mono text-xs md:px-10"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-tertiary)" }}
      >
        <span>AutoPitch — an agentic cold outreach engine, built end to end.</span>
        <span>
          Built by{" "}
          <a
            href="https://github.com/chaitanya-link"
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Chaitanya Joshi
          </a>
        </span>
      </footer>
    </div>
  );
}
