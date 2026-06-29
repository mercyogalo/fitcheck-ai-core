import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  LayoutGrid,
  User,
  History,
  Home,
  LogOut,
  Upload,
  FileText,
  X,
  Plus,
  Search,
  Filter,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Briefcase,
  Globe2,
  ChevronRight,
} from "lucide-react";
import { ScoreRing } from "./index";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FitCheck AI" },
      { name: "description", content: "Analyze job suitability, manage your resume, and review your application history." },
    ],
  }),
  component: Dashboard,
});

type View = "analyzer" | "profile" | "history";

type Analysis = {
  id: string;
  company: string;
  role: string;
  score: number;
  verdict: "Go" | "No-Go" | "Stretch";
  region: string;
  date: string;
};

const SEED_HISTORY: Analysis[] = [
  { id: "a1", company: "Stripe", role: "Senior Backend Engineer", score: 82, verdict: "Go", region: "Remote · EU", date: "2026-06-22" },
  { id: "a2", company: "Andela", role: "Staff Platform Engineer", score: 91, verdict: "Go", region: "East Africa", date: "2026-06-20" },
  { id: "a3", company: "Datadog", role: "Site Reliability Engineer", score: 58, verdict: "Stretch", region: "Remote · US", date: "2026-06-18" },
  { id: "a4", company: "Figma", role: "Frontend Engineer, Multiplayer", score: 41, verdict: "No-Go", region: "On-site SF", date: "2026-06-14" },
  { id: "a5", company: "M-KOPA", role: "Engineering Manager", score: 76, verdict: "Go", region: "Nairobi, KE", date: "2026-06-10" },
];

function Dashboard() {
  const [view, setView] = useState<View>("analyzer");
  const [history, setHistory] = useState<Analysis[]>(SEED_HISTORY);

  const [profile, setProfile] = useState({
    name: "Amina Otieno",
    role: "Senior Backend Engineer · 6 yrs",
    region: "East Africa",
    resumeName: "" as string,
    skills: [] as string[],
    experience: [] as { title: string; company: string; years: string }[],
  });

  return (
    <div className="min-h-screen flex bg-[color:var(--ice)]">
      <Sidebar view={view} setView={setView} profile={profile} />
      <main className="flex-1 min-w-0">
        <TopBar view={view} />
        <div className="p-8 max-w-6xl mx-auto">
          {view === "analyzer" && <AnalyzerView onComplete={(a) => setHistory((h) => [a, ...h])} />}
          {view === "profile" && <ProfileView profile={profile} setProfile={setProfile} />}
          {view === "history" && <HistoryView items={history} />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({
  view,
  setView,
  profile,
}: {
  view: View;
  setView: (v: View) => void;
  profile: { name: string; role: string };
}) {
  const items: { key: View; label: string; icon: typeof LayoutGrid }[] = [
    { key: "analyzer", label: "Suitability Analyzer", icon: LayoutGrid },
    { key: "profile", label: "My Profile & Resume", icon: User },
    { key: "history", label: "Analysis History", icon: History },
  ];
  return (
    <aside className="w-72 shrink-0 bg-white border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="h-12 w-12 rounded-full grid place-items-center text-white font-display font-bold ring-2 ring-[color:var(--royal)] ring-offset-2 ring-offset-white"
            style={{ background: "var(--gradient-blue)" }}
          >
            {profile.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[color:var(--deep)] truncate">{profile.name}</div>
            <div className="text-xs text-[color:var(--slate-blue)] truncate">{profile.role}</div>
          </div>
        </div>
      </div>

      <nav className="p-3 flex-1 space-y-1">
        {items.map((it) => {
          const active = view === it.key;
          return (
            <button
              key={it.key}
              onClick={() => setView(it.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-[color:var(--royal)] text-white shadow-[var(--shadow-blue)]"
                  : "text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)] hover:text-[color:var(--royal)]"
              }`}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </button>
          );
        })}
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)] hover:text-[color:var(--royal)] transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Home
        </Link>
      </nav>

      <div className="p-3 border-t border-border">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)] hover:text-[color:var(--royal)] transition-colors">
          <LogOut className="h-4 w-4" />
          Settings & Logout
        </button>
      </div>
    </aside>
  );
}

function TopBar({ view }: { view: View }) {
  const title =
    view === "analyzer" ? "Suitability Analyzer" : view === "profile" ? "My Profile & Resume" : "Analysis History";
  const sub =
    view === "analyzer"
      ? "Paste a job description and let the agent decide if it's worth applying."
      : view === "profile"
      ? "Upload your resume and set your target region for tailored matching."
      : "Every audit you've run, searchable and filterable.";
  return (
    <div className="bg-white border-b border-border">
      <div className="max-w-6xl mx-auto px-8 py-5">
        <h1 className="text-2xl font-bold text-[color:var(--deep)]">{title}</h1>
        <p className="text-sm text-[color:var(--slate-blue)] mt-1">{sub}</p>
      </div>
    </div>
  );
}

/* ============== Profile View ============== */

const MOCK_SKILLS = ["Go", "Python", "PostgreSQL", "Kubernetes", "AWS", "gRPC", "Distributed Systems", "Terraform"];
const MOCK_EXPERIENCE = [
  { title: "Senior Backend Engineer", company: "Twiga Foods", years: "2022 — Present" },
  { title: "Backend Engineer", company: "Cellulant", years: "2019 — 2022" },
  { title: "Software Engineer", company: "iHub Labs", years: "2018 — 2019" },
];

function ProfileView({
  profile,
  setProfile,
}: {
  profile: { name: string; role: string; region: string; resumeName: string; skills: string[]; experience: { title: string; company: string; years: string }[] };
  setProfile: React.Dispatch<React.SetStateAction<{ name: string; role: string; region: string; resumeName: string; skills: string[]; experience: { title: string; company: string; years: string }[] }>>;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const handleFile = useCallback(
    (name: string) => {
      setProfile((p) => ({
        ...p,
        resumeName: name,
        skills: MOCK_SKILLS,
        experience: MOCK_EXPERIENCE,
      }));
    },
    [setProfile],
  );

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 space-y-6">
        <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[color:var(--deep)]">Resume</h2>
            {profile.resumeName && (
              <button
                onClick={() => setProfile((p) => ({ ...p, resumeName: "", skills: [], experience: [] }))}
                className="text-xs text-[color:var(--slate-blue)] hover:text-[color:var(--royal)]"
              >
                Replace
              </button>
            )}
          </div>

          {!profile.resumeName ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                handleFile(f?.name ?? "resume.pdf");
              }}
              className={`mt-4 block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver ? "border-[color:var(--royal)] bg-[color:var(--ice)]" : "border-border bg-[color:var(--ice)]/40 hover:bg-[color:var(--ice)]"
              }`}
            >
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f.name);
                }}
              />
              <div className="mx-auto h-14 w-14 rounded-full grid place-items-center bg-white border border-border">
                <Upload className="h-6 w-6 text-[color:var(--royal)]" />
              </div>
              <div className="mt-4 font-semibold text-[color:var(--deep)]">Drop your resume here</div>
              <div className="mt-1 text-sm text-[color:var(--slate-blue)]">PDF or DOCX · up to 10 MB</div>
              <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2 text-xs font-semibold text-white">
                Browse files
              </div>
            </label>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-[color:var(--ice)] p-4">
              <div className="h-10 w-10 rounded-md grid place-items-center bg-white border border-border">
                <FileText className="h-5 w-5 text-[color:var(--royal)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[color:var(--deep)] truncate">{profile.resumeName}</div>
                <div className="text-xs text-[color:var(--slate-blue)]">Parsed · {profile.skills.length} skills, {profile.experience.length} roles</div>
              </div>
              <CheckCircle2 className="h-5 w-5 text-[color:var(--royal)]" />
            </div>
          )}
        </div>

        {profile.resumeName && (
          <>
            <div className="rounded-2xl bg-white border border-border p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Skills</h3>
                <span className="text-xs text-[color:var(--slate-blue)]">{profile.skills.length} detected</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ice)] border border-border px-3 py-1 text-xs font-medium text-[color:var(--slate-blue)]">
                    {s}
                    <button
                      onClick={() => setProfile((p) => ({ ...p, skills: p.skills.filter((x) => x !== s) }))}
                      className="hover:text-[color:var(--royal)]"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newSkill.trim()) {
                      setProfile((p) => ({ ...p, skills: [...new Set([...p.skills, newSkill.trim()])] }));
                      setNewSkill("");
                    }
                  }}
                  className="inline-flex items-center gap-1"
                >
                  <input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill"
                    className="rounded-full border border-border bg-white px-3 py-1 text-xs outline-none focus:border-[color:var(--royal)] w-28"
                  />
                  <button type="submit" className="h-7 w-7 grid place-items-center rounded-full bg-[color:var(--royal)] text-white">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-border p-6">
              <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Experience</h3>
              <ul className="mt-4 space-y-3">
                {profile.experience.map((x, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <div className="h-9 w-9 rounded-md grid place-items-center bg-[color:var(--ice)] border border-border">
                      <Briefcase className="h-4 w-4 text-[color:var(--royal)]" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[color:var(--deep)]">{x.title}</div>
                      <div className="text-sm text-[color:var(--slate-blue)]">{x.company} · {x.years}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <aside className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl bg-white border border-border p-6">
          <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Profile</h3>
          <div className="mt-4 space-y-4">
            <Field label="Full name" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} />
            <Field label="Role summary" value={profile.role} onChange={(v) => setProfile((p) => ({ ...p, role: v }))} />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Target region</label>
              <select
                value={profile.region}
                onChange={(e) => setProfile((p) => ({ ...p, region: e.target.value }))}
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] outline-none focus:border-[color:var(--royal)]"
              >
                {["East Africa", "West Africa", "Remote · Global", "Remote · EU", "Remote · US", "Europe", "North America", "Middle East"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-6 text-white" style={{ background: "var(--gradient-blue)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80">
            <Globe2 className="h-3.5 w-3.5" /> Regional snapshot
          </div>
          <div className="mt-3 text-2xl font-bold">{profile.region}</div>
          <p className="mt-2 text-sm text-white/80">Timezone UTC+3 · Strong overlap with EU mornings and global remote teams.</p>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] outline-none focus:border-[color:var(--royal)]"
      />
    </div>
  );
}

/* ============== Analyzer View ============== */

type ResultData = {
  score: number;
  verdict: "Go" | "No-Go" | "Stretch";
  company: string;
  role: string;
  strengths: { label: string; detail: string }[];
  gaps: { label: string; detail: string }[];
  region: { tz: string; demand: string; visa: string };
};

function AnalyzerView({ onComplete }: { onComplete: (a: Analysis) => void }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<ResultData | null>(null);

  const canSubmit = company.trim() && role.trim() && jd.trim().length > 30;

  const run = () => {
    setStatus("loading");
    setResult(null);
    setTimeout(() => {
      const score = 60 + Math.floor(Math.random() * 35);
      const verdict: ResultData["verdict"] = score >= 75 ? "Go" : score >= 55 ? "Stretch" : "No-Go";
      const data: ResultData = {
        score,
        verdict,
        company,
        role,
        strengths: [
          { label: "Distributed systems depth", detail: "6 years building payment-grade backends matches their core requirement." },
          { label: "Cloud-native tooling", detail: "Kubernetes + Terraform + AWS overlap is near-perfect with their stack." },
          { label: "Team leverage", detail: "Mentorship history aligns with their staff-track expectations." },
        ],
        gaps: [
          { label: "Rust exposure", detail: "JD lists Rust as 'strongly preferred' — no projects on resume." },
          { label: "Public OSS presence", detail: "They weight public commits; profile shows none in last 12 months." },
          { label: "Regulated-fintech experience", detail: "PCI / SOC2 ownership not evidenced in current roles." },
        ],
        region: {
          tz: "UTC+3 overlaps 5h with their core hours (Berlin) — within range.",
          demand: "Demand for this role in your region is up 18% QoQ.",
          visa: "Fully remote contract — no relocation or visa sponsorship required.",
        },
      };
      setResult(data);
      setStatus("done");
      onComplete({
        id: `a${Date.now()}`,
        company,
        role,
        score,
        verdict,
        region: "Remote · EU",
        date: new Date().toISOString().slice(0, 10),
      });
    }, 2400);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Company</label>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-border px-3">
              <Building2 className="h-4 w-4 text-[color:var(--slate-blue)]" />
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="flex-1 bg-transparent py-2 text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Job title</label>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-border px-3">
              <Briefcase className="h-4 w-4 text-[color:var(--slate-blue)]" />
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Senior Backend Engineer"
                className="flex-1 bg-transparent py-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Job description or URL</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={7}
            placeholder="Paste the full job description here — responsibilities, must-haves, nice-to-haves, location, visa notes…"
            className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--royal)] resize-none"
          />
        </div>
        <div className="mt-5 flex items-center justify-between">
          <div className="text-xs text-[color:var(--slate-blue)]">
            {jd.length > 0 ? `${jd.split(/\s+/).filter(Boolean).length} words` : "Paste a JD to begin."}
          </div>
          <button
            disabled={!canSubmit || status === "loading"}
            onClick={run}
            className="inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] hover:bg-[color:var(--ocean)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Analyze Suitability <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {status === "loading" && <LoadingResult />}
      {status === "done" && result && <ResultPanel data={result} />}
    </div>
  );
}

function LoadingResult() {
  return (
    <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-[color:var(--royal)] animate-pulse" />
        <div className="font-semibold text-[color:var(--deep)]">Agent Evaluating Match…</div>
      </div>
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="h-32 rounded-xl bg-[color:var(--ice)] animate-pulse" />
        <div className="md:col-span-2 space-y-3">
          <div className="h-4 w-1/3 rounded bg-[color:var(--ice)] animate-pulse" />
          <div className="h-3 w-full rounded bg-[color:var(--ice)] animate-pulse" />
          <div className="h-3 w-5/6 rounded bg-[color:var(--ice)] animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-[color:var(--ice)] animate-pulse" />
        </div>
      </div>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="h-40 rounded-xl bg-[color:var(--ice)] animate-pulse" />
        <div className="h-40 rounded-xl bg-[color:var(--ice)] animate-pulse" />
      </div>
    </div>
  );
}

function ResultPanel({ data }: { data: ResultData }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ScoreRing value={data.score} size={120} />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-[color:var(--slate-blue)]">Verdict</div>
            <div className="mt-1 flex items-center gap-3">
              <VerdictBadge verdict={data.verdict} />
              <span className="text-2xl font-bold text-[color:var(--deep)]">{data.role}</span>
            </div>
            <div className="text-sm text-[color:var(--slate-blue)] mt-1">at <span className="font-semibold text-[color:var(--royal)]">{data.company}</span></div>
            <p className="mt-3 text-sm text-[color:var(--slate-blue)] max-w-2xl">
              {data.verdict === "Go"
                ? "Strong fit. Your profile clears the must-haves with margin — tailor the cover letter to their specific stack and apply."
                : data.verdict === "Stretch"
                ? "Borderline. You can apply, but close one or two gaps first to materially improve outcomes."
                : "Not aligned today. Save your energy or target the upskilling plan below before reapplying in 3–6 months."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Column
          title="Strengths & Alignment"
          icon={CheckCircle2}
          tone="positive"
          items={data.strengths}
        />
        <Column
          title="Critical Gaps"
          icon={AlertTriangle}
          tone="warn"
          items={data.gaps}
        />
      </div>

      <div className="rounded-2xl p-6 text-white" style={{ background: "var(--gradient-blue)" }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80">
          <Globe2 className="h-3.5 w-3.5" /> Market & Regional Fit
        </div>
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <RegionStat icon={Clock} label="Timezone overlap" value={data.region.tz} />
          <RegionStat icon={TrendingUp} label="Hiring trend" value={data.region.demand} />
          <RegionStat icon={MapPin} label="Visa & location" value={data.region.visa} />
        </div>
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: "Go" | "No-Go" | "Stretch" }) {
  const map = {
    Go: { bg: "var(--royal)", color: "#fff", label: "GO" },
    Stretch: { bg: "var(--ocean)", color: "#fff", label: "STRETCH" },
    "No-Go": { bg: "#fff", color: "var(--royal)", label: "NO-GO", border: true },
  } as const;
  const c = map[verdict];
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wider"
      style={{ background: c.bg, color: c.color, border: "border" in c && c.border ? "1px solid var(--royal)" : undefined }}
    >
      {c.label}
    </span>
  );
}

function Column({
  title,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  icon: typeof CheckCircle2;
  tone: "positive" | "warn";
  items: { label: string; detail: string }[];
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-6">
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-md grid place-items-center"
          style={{ background: tone === "positive" ? "var(--ice)" : "color-mix(in oklab, var(--ocean) 12%, white)" }}
        >
          <Icon className="h-4 w-4 text-[color:var(--royal)]" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">{title}</h3>
      </div>
      <ul className="mt-5 space-y-4">
        {items.map((i) => (
          <li key={i.label} className="border-l-2 border-[color:var(--royal)] pl-4">
            <div className="font-semibold text-sm text-[color:var(--deep)]">{i.label}</div>
            <div className="text-sm text-[color:var(--slate-blue)] mt-1">{i.detail}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RegionStat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/15 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-white">{value}</div>
    </div>
  );
}

/* ============== History View ============== */

function HistoryView({ items }: { items: Analysis[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "Go" | "Stretch" | "No-Go">("all");

  const rows = useMemo(() => {
    return items.filter((r) => {
      const okQ = q ? (r.company + " " + r.role).toLowerCase().includes(q.toLowerCase()) : true;
      const okF = filter === "all" ? true : r.verdict === filter;
      return okQ && okF;
    });
  }, [items, q, filter]);

  return (
    <div className="rounded-2xl bg-white border border-border shadow-[var(--shadow-card)] overflow-hidden">
      <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 rounded-md border border-border px-3">
          <Search className="h-4 w-4 text-[color:var(--slate-blue)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search company or role"
            className="flex-1 bg-transparent py-2 text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border p-1">
          <Filter className="h-3.5 w-3.5 text-[color:var(--slate-blue)] mx-1" />
          {(["all", "Go", "Stretch", "No-Go"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-[color:var(--royal)] text-white"
                  : "text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)]"
              }`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[color:var(--ice)] text-left text-xs uppercase tracking-wider text-[color:var(--slate-blue)]">
            <th className="px-5 py-3 font-semibold">Company</th>
            <th className="px-5 py-3 font-semibold">Role</th>
            <th className="px-5 py-3 font-semibold">Region</th>
            <th className="px-5 py-3 font-semibold">Score</th>
            <th className="px-5 py-3 font-semibold">Verdict</th>
            <th className="px-5 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-border hover:bg-[color:var(--ice)]/50">
              <td className="px-5 py-4 font-semibold text-[color:var(--deep)]">{r.company}</td>
              <td className="px-5 py-4 text-[color:var(--slate-blue)]">{r.role}</td>
              <td className="px-5 py-4 text-[color:var(--slate-blue)]">{r.region}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-[color:var(--ice)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: "var(--gradient-blue)" }} />
                  </div>
                  <span className="font-semibold text-[color:var(--royal)]">{r.score}</span>
                </div>
              </td>
              <td className="px-5 py-4"><VerdictBadge verdict={r.verdict} /></td>
              <td className="px-5 py-4 text-[color:var(--slate-blue)]">{r.date}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-5 py-12 text-center text-sm text-[color:var(--slate-blue)]">No analyses match those filters.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
