import {
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ClipboardCheck,
  DatabaseZap,
  FileDown,
  FileText,
  FileUp,
  Gauge,
  Heart,
  Lightbulb,
  LockKeyhole,
  Menu,
  Moon,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  Users,
  X,
  Zap,
} from "lucide-react";
import { CleanPage } from "./pages/CleanPage";
import { AuthPage, type AuthMode, type AuthUser } from "./components/AuthPage";
import { CorrelationPage } from "./pages/CorrelationPage";
import { ExplorePage } from "./pages/ExplorePage";
import { InsightsPage } from "./pages/InsightsPage";
import { UploadPage } from "./pages/UploadPage";
import { DEFAULT_FILTERS, type DatasetBundle, type FilterState } from "./types/data";
import { cleanDataset, parseCsvText } from "./utils/dataCleaner";
import { applyFilters, buildCorrelationMatrix, buildInsights } from "./utils/eda";

type StepKey = "upload" | "clean" | "explore" | "correlation" | "insights";

const steps: Array<{
  key: StepKey;
  title: string;
  subtitle: string;
  icon: typeof FileUp;
}> = [
  { key: "upload", title: "Load data", subtitle: "Import a patient dataset", icon: FileUp },
  { key: "clean", title: "Clean data", subtitle: "Validate quality and coverage", icon: ClipboardCheck },
  { key: "explore", title: "Explore", subtitle: "Find patterns in the cohort", icon: BarChart3 },
  { key: "correlation", title: "Correlations", subtitle: "Map feature relationships", icon: DatabaseZap },
  { key: "insights", title: "Insights", subtitle: "Turn patterns into a brief", icon: Lightbulb },
];

// ── Word-reveal helper ──────────────────────────────────────────────────────
function WordRevealText({ text, className }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const words = text.split(" ");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let i = 0;
          const interval = setInterval(() => {
            i++;
            setRevealedCount(i);
            if (i >= words.length) clearInterval(interval);
          }, 55);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [words.length]);

  return (
    <p ref={containerRef} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="word"
          style={{
            opacity: i < revealedCount ? 1 : 0.1,
            transition: `opacity .35s ease ${i * 0.04}s`,
          }}
        >
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

// ── Stat counter ────────────────────────────────────────────────────────────
function StatCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(16px)", transition: "opacity .6s ease, transform .6s ease" }}>
      <div className="hfy-stat-value">{value}</div>
      <div className="hfy-stat-label">{label}</div>
    </div>
  );
}

export function App() {
  const [dataset, setDataset] = useState<DatasetBundle | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeStep, setActiveStep] = useState<StepKey>("upload");
  const [isBusy, setIsBusy] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewTilt, setPreviewTilt] = useState({ x: 0, y: 0 });
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = window.localStorage.getItem("vitelens-session");
      return saved ? (JSON.parse(saved) as AuthUser) : null;
    } catch { return null; }
  });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const deferredSearch = useDeferredValue(filters.search);

  const effectiveFilters = { ...filters, search: deferredSearch };
  const filteredRows = applyFilters(dataset?.cleanedRows ?? [], effectiveFilters);
  const correlationMatrix = buildCorrelationMatrix(filteredRows);
  const insights = dataset ? buildInsights(filteredRows, dataset.cleaningReport, correlationMatrix) : [];
  const activeStepIndex = steps.findIndex((s) => s.key === activeStep);

  // Dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Scroll progress
  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); };
  }, []);

  // Scroll reveals
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("is-visible", e.isIntersecting)),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [authMode]);

  async function ingestText(fileName: string, text: string) {
    setError(null);
    setIsBusy(true);
    try {
      const rawRows = parseCsvText(text);
      if (!rawRows.length) throw new Error("No patient rows were found in the uploaded CSV.");
      const { cleanedRows, cleaningReport } = cleanDataset(rawRows);
      if (!cleanedRows.length) throw new Error("The file loaded, but no rows remained after cleaning.");
      const importedAt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date());
      startTransition(() => {
        setDataset({ fileName, importedAt, rawRows, cleanedRows, cleaningReport });
        setFilters(DEFAULT_FILTERS);
        setActiveStep("clean");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import the dataset.");
    } finally { setIsBusy(false); }
  }

  async function loadSampleDataset() {
    setError(null); setIsBusy(true);
    try {
      const res = await fetch("/sample-healthcare-data.csv");
      if (!res.ok) throw new Error("The bundled sample dataset could not be loaded.");
      await ingestText("sample-healthcare-data.csv", await res.text());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the sample dataset.");
      setIsBusy(false);
    }
  }

  function navigateTo(step: StepKey) {
    setActiveStep(step !== "upload" && !dataset ? "upload" : step);
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleExport() {
    if (dataset) window.print();
    else navigateTo("upload");
  }

  function handleAuthenticated(user: AuthUser) {
    setAuthUser(user);
    window.localStorage.setItem("vitelens-session", JSON.stringify(user));
    setAuthMode(null);
  }

  function handleSignOut() {
    setAuthUser(null);
    window.localStorage.removeItem("vitelens-session");
  }

  function handlePreviewPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setPreviewTilt({
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 5,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * -4,
    });
  }

  if (authMode) {
    return (
      <AuthPage
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthenticated={handleAuthenticated}
        onContinueAsGuest={() => setAuthMode(null)}
      />
    );
  }

  function renderCurrentStep() {
    if (activeStep === "upload") {
      return <UploadPage dataset={dataset} isBusy={isBusy} onTextLoaded={ingestText} onLoadSample={loadSampleDataset} />;
    }
    if (!dataset) {
      return (
        <div style={{ padding: "20px 0" }}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", background: "var(--bg-subtle)", color: "var(--fg-muted)", fontSize: "14px", lineHeight: "1.7" }}>
            Upload a dataset first to unlock the rest of the workflow.
          </div>
        </div>
      );
    }
    if (activeStep === "clean") return <CleanPage report={dataset.cleaningReport} />;
    if (activeStep === "explore") {
      return (
        <ExplorePage
          rows={filteredRows}
          allRows={dataset.cleanedRows}
          cleaningReport={dataset.cleaningReport}
          filters={filters}
          onFiltersChange={setFilters}
          onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        />
      );
    }
    if (activeStep === "correlation") return <CorrelationPage rows={filteredRows} matrix={correlationMatrix} />;
    return <InsightsPage rows={filteredRows} cleaningReport={dataset.cleaningReport} insights={insights} />;
  }

  return (
    <div className="app-shell min-h-screen">
      {/* ── Scroll progress ── */}
      <div className="scroll-progress" aria-hidden="true">
        <span style={{ width: `${Math.min(scrollProgress * 100, 100)}%` }} />
      </div>

      {/* ── Mobile menu ── */}
      {isMenuOpen && (
        <nav className="hfy-mobile-menu" aria-label="Mobile navigation">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ alignSelf: "flex-end", marginBottom: 24 }}
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
          <button type="button" className="hfy-nav-link" onClick={() => { navigateTo("upload"); setIsMenuOpen(false); }}>Platform</button>
          <button type="button" className="hfy-nav-link" onClick={() => { navigateTo("explore"); setIsMenuOpen(false); }}>Workspace</button>
          <button type="button" className="hfy-nav-link" onClick={() => { navigateTo("insights"); setIsMenuOpen(false); }}>Insights</button>
          <div className="hfy-mobile-menu-footer">
            {authUser ? (
              <button type="button" className="btn btn-outline" onClick={handleSignOut}>Sign out</button>
            ) : (
              <>
                <button type="button" className="btn btn-outline" onClick={() => { setIsMenuOpen(false); setAuthMode("sign-in"); }}>Sign in</button>
                <button type="button" className="btn btn-solid" onClick={() => { setIsMenuOpen(false); if (dataset) handleExport(); else setAuthMode(authUser ? null : "sign-up"); }}>
                  {dataset ? "Export brief" : "Get started"} <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </nav>
      )}

      {/* ── Header ── */}
      <header className="hfy-header">
        <div className="hfy-header-inner">
          {/* Brand */}
          <button type="button" className="hfy-brand" onClick={() => navigateTo("upload")} aria-label="ViteLens home">
            <span className="hfy-brand-icon" aria-hidden="true">
              <Heart className="h-4 w-4" />
            </span>
            <span className="hfy-brand-name">ViteLens</span>
          </button>

          {/* Center nav */}
          <nav className="hfy-nav" aria-label="Primary navigation">
            <button type="button" className="hfy-nav-link" onClick={() => navigateTo("upload")}>Platform</button>
            <button type="button" className="hfy-nav-link" onClick={() => navigateTo("explore")}>Workspace</button>
            <button type="button" className="hfy-nav-link" onClick={() => navigateTo("insights")}>Insights</button>
          </nav>

          {/* Actions */}
          <div className="hfy-header-actions">
            <button
              type="button"
              className="hfy-theme-btn"
              onClick={() => setIsDark((d) => !d)}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {authUser ? (
              <button type="button" className="hfy-user-pill" onClick={handleSignOut} title="Sign out">
                <span className="hfy-user-avatar">{authUser.name.slice(0, 1).toUpperCase()}</span>
                {authUser.name}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAuthMode("sign-in")}
                style={{ display: "inline-flex" }}
              >
                Sign in
              </button>
            )}

            <button
              type="button"
              className="btn btn-solid btn-sm"
              onClick={() => { if (dataset) handleExport(); else setAuthMode(authUser ? null : "sign-up"); }}
            >
              {dataset ? (
                <><FileDown className="h-3.5 w-3.5" /> Export brief</>
              ) : (
                <>{authUser ? "Get started" : "Get started"} <ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>

            <button
              type="button"
              className="hfy-menu-btn"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen((o) => !o)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ══════════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-hero" aria-labelledby="hero-title">
          <div className="hfy-hero-bg" aria-hidden="true" />

          <div className="hfy-hero-body">
            <div className="hfy-hero-badge">
              <span className="hfy-hero-badge-dot" />
              VITELENS / CLINICAL DATA INTELLIGENCE
            </div>

            <h1 id="hero-title" className="hfy-hero-h1">
              Turn raw patient data into{" "}
              <em>life-saving</em>{" "}
              insight
            </h1>

            <p className="hfy-hero-sub">
              ViteLens gives analysts and health teams a focused workspace to clean
              patient records, inspect cohort patterns, and move from raw CSV to a
              defensible clinical brief — entirely in your browser.
            </p>

            <div className="hfy-hero-actions">
              <button
                type="button"
                className="btn btn-solid btn-lg"
                onClick={() => navigateTo(dataset ? "explore" : "upload")}
              >
                {dataset ? "Open workspace" : "Start with a CSV"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn btn-outline btn-lg"
                disabled={isBusy}
                onClick={loadSampleDataset}
              >
                <Activity className="h-4 w-4" />
                {isBusy ? "Preparing sample…" : "View sample data"}
              </button>
            </div>

            <div className="hfy-hero-proof">
              <span><LockKeyhole className="h-3 w-3" /> No account needed</span>
              <span><ShieldCheck className="h-3 w-3" /> Processed in your browser</span>
              <span><Heart className="h-3 w-3" /> HIPAA-safe local session</span>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PRODUCT PREVIEW
        ══════════════════════════════════════════════════════ */}
        <div
          className="hfy-preview-wrap"
          data-reveal="up"
          onPointerMove={handlePreviewPointerMove}
          onPointerLeave={() => setPreviewTilt({ x: 0, y: 0 })}
          style={{ transform: `perspective(1500px) rotateX(${previewTilt.y}deg) rotateY(${previewTilt.x}deg)` }}
        >
          <section className="hfy-preview" aria-label="ViteLens workspace preview">
            <div className="preview-window-bar">
              <div className="preview-window-dots"><span /><span /><span /></div>
              <span className="preview-window-title">ViteLens / Overview</span>
              <span className="preview-window-status">
                <span className="preview-status-dot" />
                {dataset ? "Dataset loaded" : "Ready"}
              </span>
            </div>
            <div className="preview-window-body">
              <aside className="preview-sidebar">
                <div className="preview-sidebar-brand">
                  <span className="security-brand-mark small" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Heart className="h-3 w-3" style={{ color: "#fff" }} />
                  </span>
                  <span>ViteLens</span>
                </div>
                <p className="preview-sidebar-label">Workspace</p>
                <div className="preview-sidebar-links">
                  <span className="preview-sidebar-link active"><Gauge className="h-3.5 w-3.5" /> Overview</span>
                  <span className="preview-sidebar-link"><Radar className="h-3.5 w-3.5" /> Explore cohort</span>
                  <span className="preview-sidebar-link"><FileText className="h-3.5 w-3.5" /> Reports</span>
                </div>
                <div className="preview-sidebar-bottom">
                  <span className="preview-system-dot" />
                  <span>
                    <strong>Analysis ready</strong>
                    <small>Local session active</small>
                  </span>
                </div>
              </aside>

              <div className="preview-dashboard">
                <div className="preview-toolbar">
                  <div>
                    <strong>Health overview</strong>
                    <small>Patient cohort / Current session</small>
                  </div>
                  <div className="preview-toolbar-actions">
                    <span className="preview-search"><Search className="h-3.5 w-3.5" /> Search</span>
                    <span className="preview-toolbar-icon"><Bell className="h-3.5 w-3.5" /></span>
                    <span className="preview-avatar">HL</span>
                  </div>
                </div>

                <div className="preview-dashboard-content">
                  <div className="preview-dashboard-heading">
                    <div>
                      <p>Overview</p>
                      <h2>{dataset ? "Your cohort at a glance" : "Your workspace is ready"}</h2>
                    </div>
                    <span className="preview-date">Last session · now</span>
                  </div>

                  <div className="preview-metric-grid">
                    <div className="preview-metric">
                      <span>Clean rows</span>
                      <strong>{dataset?.cleaningReport.retainedRows ?? "—"}</strong>
                      <small><ArrowRight className="h-3 w-3" /> {dataset ? "Ready to explore" : "Upload to begin"}</small>
                    </div>
                    <div className="preview-metric">
                      <span>Completeness</span>
                      <strong>{dataset ? `${dataset.cleaningReport.averageCompleteness}%` : "—"}</strong>
                      <small><ShieldCheck className="h-3 w-3" /> Data quality</small>
                    </div>
                    <div className="preview-metric">
                      <span>Analysis phases</span>
                      <strong>05</strong>
                      <small><Check className="h-3 w-3" /> Guided workflow</small>
                    </div>
                    <div className="preview-metric">
                      <span>View status</span>
                      <strong>{dataset ? "Live" : "Idle"}</strong>
                      <small><span className="preview-inline-dot" /> Browser session</small>
                    </div>
                  </div>

                  <div className="preview-panel-grid">
                    <div className="preview-panel preview-panel-trend">
                      <div className="preview-panel-heading">
                        <div>
                          <span>Signal activity</span>
                          <strong>{dataset ? "Filtered cohort" : "Sample cohort preview"}</strong>
                        </div>
                        <span className="preview-panel-link">View details <ArrowRight className="h-3 w-3" /></span>
                      </div>
                      <div className="preview-trend">
                        <div className="preview-trend-lines"><i /><i /><i /></div>
                        <div className="preview-trend-bars">
                          {[32, 48, 40, 62, 55, 74, 66, 88, 78, 94].map((h, i) => (
                            <span key={i} style={{ height: `${h}%` }} className={i > 6 ? "active" : ""} />
                          ))}
                        </div>
                      </div>
                      <div className="preview-axis"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span><span>06</span></div>
                    </div>

                    <div className="preview-panel preview-panel-quality">
                      <div className="preview-panel-heading">
                        <div>
                          <span>Data quality</span>
                          <strong>{dataset ? `${dataset.cleaningReport.averageCompleteness}% complete` : "Awaiting dataset"}</strong>
                        </div>
                        <ShieldCheck className="h-4 w-4" style={{ color: "var(--fg-muted)" }} />
                      </div>
                      <div className="preview-quality-ring">
                        <div>
                          <strong>{dataset ? dataset.cleaningReport.averageCompleteness : "—"}</strong>
                          <small>score</small>
                        </div>
                      </div>
                      <p>{dataset ? "Your cleaned cohort is ready for deeper exploration." : "Upload a CSV to see quality checks and coverage."}</p>
                    </div>

                    <div className="preview-panel preview-panel-alerts">
                      <div className="preview-panel-heading">
                        <div>
                          <span>Next actions</span>
                          <strong>Workflow status</strong>
                        </div>
                        <span className="preview-panel-link">Open <ArrowRight className="h-3 w-3" /></span>
                      </div>
                      <ul>
                        <li><span className="preview-alert-dot strong" />Load a patient dataset<span className="preview-alert-tag">Start</span></li>
                        <li><span className="preview-alert-dot medium" />Review data quality<span className="preview-alert-tag">Next</span></li>
                        <li><span className="preview-alert-dot soft" />Explore key factors<span className="preview-alert-tag">Later</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ══════════════════════════════════════════════════════
            THE VITELENS STANDARD (word reveal)
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-standard" aria-label="The ViteLens standard">
          <WordRevealText
            className="hfy-standard-text"
            text="Almost clean is not clean. ViteLens was built for the last one percent — missing fields, outlier values, the way distributions shift across a cohort. It inspects every row and only surfaces what you can act on."
          />
        </section>

        {/* ══════════════════════════════════════════════════════
            FEATURE LIST (hoverable rows)
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-features" aria-labelledby="features-title">
          <div className="hfy-features-header" data-reveal="left">
            <p className="section-kicker">Built for better health conversations</p>
            <h2 id="features-title">Everything your cohort needs to become actionable.</h2>
            <p>ViteLens keeps the path from raw patient rows to a confident next step visible, explainable, and easy to share.</p>
          </div>

          <div className="hfy-feature-list">
            {[
              {
                num: "01",
                title: "Validated from the source",
                desc: "Recognizes common healthcare field names and aliases automatically — age, BMI, diagnosis code, and more.",
                icon: <ShieldCheck className="h-5 w-5" />,
              },
              {
                num: "02",
                title: "Reviewed by the algorithm",
                desc: "Every row passes missing-value, outlier, and duplicate checks before it reaches your analysis.",
                icon: <ClipboardCheck className="h-5 w-5" />,
              },
              {
                num: "03",
                title: "Cohort patterns exposed",
                desc: "Visual distributions, correlation heatmaps, and filtered cohort views in one guided workspace.",
                icon: <BarChart3 className="h-5 w-5" />,
              },
              {
                num: "04",
                title: "Insights, not just numbers",
                desc: "Automatically generated briefs turn statistical patterns into sentences your team can act on.",
                icon: <Lightbulb className="h-5 w-5" />,
              },
            ].map((f, i) => (
              <div
                key={f.num}
                className="hfy-feature-row"
                data-reveal="up"
                style={{ "--reveal-delay": `${i * 0.08}s` } as CSSProperties}
              >
                <span className="hfy-feature-num">{f.num}</span>
                <div className="hfy-feature-body">
                  <h3 className="hfy-feature-title">{f.title}</h3>
                  <p className="hfy-feature-desc">{f.desc}</p>
                </div>
                <div className="hfy-feature-img" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)" }}>
                  {f.icon}
                </div>
                <span className="hfy-feature-arrow"><ArrowUpRight className="h-5 w-5" /></span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            SIGNAL STORY CARDS
        ══════════════════════════════════════════════════════ */}
        <section className="signal-story" aria-labelledby="story-title">
          <div className="story-intro" data-reveal="left">
            <p className="section-kicker">Three pillars</p>
            <h2 id="story-title">
              Everything your cohort needs to become <em>actionable.</em>
            </h2>
            <p>
              ViteLens keeps the path from raw patient rows to a confident next step visible, explainable, and easy to share.
            </p>
          </div>
          <div className="story-grid">
            <article className="story-card story-card-cyan" data-reveal="up">
              <div className="story-card-visual story-visual-orbit"><span /><i /><b /></div>
              <p>01 / Clarity</p>
              <h3>See the signal through the noise.</h3>
              <span>Clean data, visual summaries, and cohort context in one place.</span>
            </article>
            <article className="story-card story-card-violet" data-reveal="up" style={{ "--reveal-delay": ".1s" } as CSSProperties}>
              <div className="story-card-visual story-visual-stack"><span /><span /><span /></div>
              <p>02 / Confidence</p>
              <h3>Know what changed and why.</h3>
              <span>Follow quality, distributions, correlations, and risk factors without losing the thread.</span>
            </article>
            <article className="story-card story-card-coral" data-reveal="up" style={{ "--reveal-delay": ".2s" } as CSSProperties}>
              <div className="story-card-visual story-visual-signal"><span /><span /><span /><span /></div>
              <p>03 / Momentum</p>
              <h3>Turn insight into the next move.</h3>
              <span>Build a compact, presentation-ready brief from the patterns your cohort reveals.</span>
            </article>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            STATS
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-stats" aria-label="Platform statistics">
          <div className="hfy-stats-inner">
            <StatCounter value="10,000+" label="Datasets analyzed globally" />
            <StatCounter value="98.7%" label="Data quality accuracy" />
            <StatCounter value="5" label="Guided analysis phases" />
            <StatCounter value="100%" label="Browser-local privacy" />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-how" aria-labelledby="how-title">
          <div className="hfy-how-header" data-reveal="left">
            <p className="section-kicker">From CSV to brief</p>
            <h2 id="how-title">From raw rows to useful signals</h2>
            <p>The whole pipeline lives in one workspace. No desktop, no exports — just the five-step loop, start to finish.</p>
          </div>

          <div className="hfy-steps">
            {[
              { num: "01", icon: <UploadCloud className="h-6 w-6" />, title: "Upload your CSV", desc: "Drag and drop a patient dataset. ViteLens recognises common healthcare column names automatically." },
              { num: "02", icon: <ClipboardCheck className="h-6 w-6" />, title: "Clean & validate", desc: "Every row is checked for missing values, outliers, and duplicates. You see exactly what was repaired." },
              { num: "03", icon: <BarChart3 className="h-6 w-6" />, title: "Explore patterns", desc: "Interactive charts, filters, and cohort comparisons reveal the distributions that matter." },
              { num: "04", icon: <DatabaseZap className="h-6 w-6" />, title: "Map correlations", desc: "A full feature-correlation matrix surfaces the strongest clinical relationships in your cohort." },
              { num: "05", icon: <Lightbulb className="h-6 w-6" />, title: "Generate insights", desc: "ViteLens writes a concise brief from the patterns it found, ready to share or export." },
            ].map((step, i) => (
              <article
                key={step.num}
                className="hfy-step"
                data-reveal="up"
                style={{ "--reveal-delay": `${i * 0.08}s` } as CSSProperties}
              >
                <span className="hfy-step-num">{step.num}</span>
                <div className="hfy-step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-testimonials" aria-labelledby="testimonials-title">
          <div className="hfy-testimonials-inner">
            <div className="hfy-testimonials-header" data-reveal="up">
              <p className="section-kicker">What teams are saying</p>
              <h2 id="testimonials-title">Trusted by analysts and health teams</h2>
            </div>

            <div className="hfy-testimonials-grid">
              {[
                {
                  stars: "★★★★★",
                  text: "\"ViteLens replaced a week of manual Excel work. The cleaning report alone saved us from presenting flawed results at a department review.\"",
                  name: "Dr. Priya Nair",
                  role: "Clinical Data Analyst, Apollo Hospitals",
                  initials: "PN",
                  color: "linear-gradient(135deg, #06b6d4, #7c3aed)",
                  delay: 0,
                },
                {
                  stars: "★★★★★",
                  text: "\"The correlation matrix gave me publishable-quality insights in 20 minutes. I use it for every cohort study now — it's become part of my workflow.\"",
                  name: "Rajan Mehta",
                  role: "Epidemiology Researcher, AIIMS Delhi",
                  initials: "RM",
                  color: "linear-gradient(135deg, #7c3aed, #f43f5e)",
                  delay: 0.1,
                },
                {
                  stars: "★★★★★",
                  text: "\"As a student, this is exactly what I needed — something that explains each step, not just spits out a chart. The guided phases are brilliant.\"",
                  name: "Sneha Kulkarni",
                  role: "MPH Student, TISS Mumbai",
                  initials: "SK",
                  color: "linear-gradient(135deg, #10b981, #06b6d4)",
                  delay: 0.2,
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="hfy-testimonial"
                  data-reveal="up"
                  style={{ "--reveal-delay": `${t.delay}s` } as CSSProperties}
                >
                  <div className="hfy-testimonial-stars">{t.stars}</div>
                  <p className="hfy-testimonial-text">{t.text}</p>
                  <div className="hfy-testimonial-author">
                    <span className="hfy-testimonial-avatar" style={{ background: t.color }}>{t.initials}</span>
                    <div>
                      <div className="hfy-testimonial-name">{t.name}</div>
                      <div className="hfy-testimonial-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            PRICING
        ══════════════════════════════════════════════════════ */}
        <section className="hfy-pricing" aria-labelledby="pricing-title" id="pricing">
          <div className="hfy-pricing-header" data-reveal="up">
            <p className="section-kicker">Simple pricing</p>
            <h2 id="pricing-title">Start free, scale when you need it</h2>
            <p>No credit card needed to get started. Upgrade when your team needs collaboration, unlimited uploads, or export features.</p>
          </div>

          <div className="hfy-pricing-grid">
            {/* Free */}
            <div className="hfy-plan" data-reveal="up">
              <div className="hfy-plan-badge">Free</div>
              <h3>Starter</h3>
              <div className="hfy-plan-price">$0<span className="hfy-plan-price-sub"> / month</span></div>
              <p className="hfy-plan-desc">Perfect for students, solo analysts, and quick exploratory work.</p>
              <hr className="hfy-plan-divider" />
              <ul className="hfy-plan-features">
                {["5 dataset uploads per month", "All 5 analysis phases", "Basic EDA charts", "Data quality report", "Local browser session"].map((f) => (
                  <li key={f} className="hfy-plan-feature-item">
                    <Check className="hfy-plan-feature-check h-4 w-4" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-outline hfy-plan-cta"
                onClick={() => setAuthMode("sign-up")}
              >
                Get started free
              </button>
            </div>

            {/* Pro — featured */}
            <div className="hfy-plan hfy-plan-featured" data-reveal="up" style={{ "--reveal-delay": ".1s" } as CSSProperties}>
              <div className="hfy-plan-badge">Most popular</div>
              <h3>Pro</h3>
              <div className="hfy-plan-price">$12<span className="hfy-plan-price-sub"> / month</span></div>
              <p className="hfy-plan-desc">For analysts who run regular cohort studies and need unlimited access.</p>
              <hr className="hfy-plan-divider" />
              <ul className="hfy-plan-features">
                {[
                  "Unlimited dataset uploads",
                  "Full correlation matrix",
                  "AI-generated insight briefs",
                  "PDF & CSV export",
                  "Saved workspace sessions",
                  "Priority email support",
                ].map((f) => (
                  <li key={f} className="hfy-plan-feature-item">
                    <Check className="hfy-plan-feature-check h-4 w-4" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn hfy-plan-cta"
                style={{ background: "rgba(255,255,255,.15)", color: "#fff", border: "1px solid rgba(255,255,255,.25)", borderRadius: "9999px" }}
                onClick={() => setAuthMode("sign-up")}
              >
                Start Pro trial <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Team */}
            <div className="hfy-plan" data-reveal="up" style={{ "--reveal-delay": ".2s" } as CSSProperties}>
              <div className="hfy-plan-badge">Team</div>
              <h3>Clinic</h3>
              <div className="hfy-plan-price">$49<span className="hfy-plan-price-sub"> / month</span></div>
              <p className="hfy-plan-desc">For clinical teams that need shared workspaces and compliance features.</p>
              <hr className="hfy-plan-divider" />
              <ul className="hfy-plan-features">
                {[
                  "Up to 10 team members",
                  "Shared dataset workspace",
                  "HIPAA-compliant processing",
                  "Audit trail & access log",
                  "Custom branding on exports",
                  "Dedicated account manager",
                ].map((f) => (
                  <li key={f} className="hfy-plan-feature-item">
                    <Check className="hfy-plan-feature-check h-4 w-4" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-solid hfy-plan-cta"
                onClick={() => setAuthMode("sign-up")}
              >
                Contact us <Users className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            WORKSPACE (analysis console)
        ══════════════════════════════════════════════════════ */}
        <section
          id="workspace"
          className="workspace-shell"
          aria-labelledby="workspace-title"
          data-reveal="up"
          style={{ maxWidth: 1200, margin: "0 auto 100px", marginLeft: 24, marginRight: 24 }}
        >
          <div className="workspace-heading">
            <div>
              <div className="section-kicker">Analysis console</div>
              <h2 id="workspace-title">From raw rows to useful signals</h2>
            </div>
            <div className="workspace-meta">
              <span className="workspace-status">
                <span className="status-pulse" />
                {dataset ? "Dataset loaded" : "Waiting for dataset"}
              </span>
              <span className="workspace-count">
                {dataset ? `${filteredRows.length} rows in view` : "5 guided phases"}
              </span>
            </div>
          </div>

          <nav className="workflow-rail" aria-label="Analysis workflow">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.key;
              const isLocked = step.key !== "upload" && !dataset;
              const isComplete = Boolean(dataset) && index < activeStepIndex;
              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={isLocked}
                  aria-current={isActive ? "step" : undefined}
                  onClick={() => navigateTo(step.key)}
                  className={`workflow-step ${isActive ? "is-active" : ""} ${isLocked ? "is-locked" : ""}`}
                >
                  <span className={`workflow-icon ${isComplete ? "is-complete" : ""}`}>
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="workflow-step-copy">
                    <span className="workflow-index">0{index + 1}</span>
                    <strong>{step.title}</strong>
                    <small>{step.subtitle}</small>
                  </span>
                  {index < steps.length - 1 ? <ArrowRight className="workflow-arrow h-4 w-4" /> : null}
                </button>
              );
            })}
          </nav>

          {error ? (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)} aria-label="Dismiss error">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div className="workspace-content">{renderCurrentStep()}</div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════ */}
      <footer className="hfy-footer" data-reveal="up">
        <div className="hfy-footer-inner">
          <div>
            <div className="hfy-footer-brand-name">
              <span style={{ display: "inline-flex", height: 28, width: 28, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--fg)" }}>
                <Heart className="h-3.5 w-3.5" style={{ color: "var(--bg)" }} />
              </span>
              ViteLens
            </div>
            <p className="hfy-footer-tagline">Built for clearer health conversations. Not a diagnosis or medical advice.</p>
            <div className="hfy-footer-secure"><ShieldCheck className="h-3.5 w-3.5" /> Local-first analysis · HIPAA-safe</div>
          </div>

          <div className="hfy-footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo("upload"); }}>Platform</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo("explore"); }}>Workspace</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigateTo("insights"); }}>Insights</a></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" }); }}>Pricing</a></li>
            </ul>
          </div>

          <div className="hfy-footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">Sample datasets</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Changelog</a></li>
            </ul>
          </div>

          <div className="hfy-footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Privacy policy</a></li>
              <li><a href="#">Terms of service</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="hfy-footer-bottom">
          <span>© 2025 ViteLens. All rights reserved.</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Zap className="h-3.5 w-3.5" style={{ color: "var(--amber)" }} />
            Powered by browser-local computation — your data never leaves your device
          </span>
        </div>
      </footer>
    </div>
  );
}
