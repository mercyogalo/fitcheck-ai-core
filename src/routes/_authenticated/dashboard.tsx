import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Loader2,
  BarChart3,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreRing } from "../index";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FitCheck AI" },
      { name: "description", content: "Analyze job suitability, manage your resume, and review your application history." },
    ],
  }),
  component: Dashboard,
});

/* ============== Types (aligned with DB schema) ============== */

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  target_region: string | null;
  skills: string[];
  resume_text: string | null;
  resume_name: string | null;
};

type AnalysisRow = {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  match_score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  regional_fit: string | null;
  upskilling_steps: string[];
  created_at: string;
};

type View = "analyzer" | "profile" | "history";

const REGIONS = [
  "East Africa",
  "West Africa",
  "Remote · Global",
  "Remote · EU",
  "Remote · US",
  "Europe",
  "North America",
  "Middle East",
];

/* ============== Root ============== */

function Dashboard() {
  const nav = useNavigate();
  const [view, setView] = useState<View>("analyzer");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [history, setHistory] = useState<AnalysisRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      setProfile(data as Profile | null);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setHistory((data as AnalysisRow[]) ?? []);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadHistory();
  }, [loadProfile, loadHistory]);

  async function onSignOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  return (
    <div className="min-h-screen flex bg-[color:var(--ice)]">
      <Sidebar
        view={view}
        setView={setView}
        profile={profile}
        loading={profileLoading}
        onSignOut={onSignOut}
      />
      <main className="flex-1 min-w-0">
        <TopBar view={view} />
        <div className="p-8 max-w-6xl mx-auto">
          {view === "analyzer" && (
            <AnalyzerView
              profile={profile}
              onComplete={loadHistory}
            />
          )}
          {view === "profile" && (
            <ProfileView
              profile={profile}
              loading={profileLoading}
              error={profileError}
              onSaved={loadProfile}
            />
          )}
          {view === "history" && (
            <HistoryView
              items={history}
              loading={historyLoading}
              error={historyError}
              onDeleted={loadHistory}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ============== Sidebar ============== */

function initialsOf(name: string | null | undefined, email: string | null | undefined) {
  const src = (name && name.trim()) || (email && email.split("@")[0]) || "";
  const parts = src.split(/\s+|\./).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "•";
}

function Sidebar({
  view,
  setView,
  profile,
  loading,
  onSignOut,
}: {
  view: View;
  setView: (v: View) => void;
  profile: Profile | null;
  loading: boolean;
  onSignOut: () => void;
}) {
  const items: { key: View; label: string; icon: typeof LayoutGrid }[] = [
    { key: "analyzer", label: "Suitability Analyzer", icon: LayoutGrid },
    { key: "profile", label: "My Profile & Resume", icon: User },
    { key: "history", label: "Analysis History", icon: History },
  ];
  const name = profile?.full_name || profile?.email?.split("@")[0] || "Signed in";
  const sub = profile?.target_region || profile?.email || "Set your target region";

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-12 w-12 rounded-full object-cover ring-2 ring-[color:var(--royal)] ring-offset-2 ring-offset-white"
            />
          ) : (
            <div
              className="h-12 w-12 rounded-full grid place-items-center text-white font-display font-bold ring-2 ring-[color:var(--royal)] ring-offset-2 ring-offset-white"
              style={{ background: "var(--gradient-blue)" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : initialsOf(profile?.full_name, profile?.email)}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-[color:var(--deep)] truncate">
              {loading ? "Loading…" : name}
            </div>
            <div className="text-xs text-[color:var(--slate-blue)] truncate">{sub}</div>
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
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)] hover:text-[color:var(--royal)] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function TopBar({ view }: { view: View }) {
  const title = view === "analyzer" ? "Suitability Analyzer" : view === "profile" ? "My Profile & Resume" : "Analysis History";
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

function ProfileView({
  profile,
  loading,
  error,
  onSaved,
}: {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
}) {
  const [fullName, setFullName] = useState("");
  const [region, setRegion] = useState<string>(REGIONS[0]);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setRegion(profile.target_region ?? REGIONS[0]);
    setSkills(profile.skills ?? []);
    setResumeText(profile.resume_text ?? "");
    setResumeName(profile.resume_name);
  }, [profile]);

  async function handleFile(file: File) {
    setUploadErr(null);
    if (file.size > 10 * 1024 * 1024) {
      setUploadErr("File exceeds 10 MB.");
      return;
    }
    // Client-side extraction: only plain text/markdown here.
    // For PDF/DOCX we recommend pasting the text into the resume field.
    const isText = file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name);
    if (isText) {
      const text = await file.text();
      setResumeText(text.slice(0, 100_000));
      setResumeName(file.name);
    } else {
      setResumeName(file.name);
      setUploadErr(
        "Binary resume detected. Please paste the plain text below — extraction from PDF/DOCX requires copy-paste for now.",
      );
    }
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          target_region: region || null,
          skills,
          resume_text: resumeText.trim() || null,
          resume_name: resumeName,
        })
        .eq("id", profile.id);
      if (error) throw error;
      setSaveMsg("Saved.");
      await onSaved();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }

  if (loading && !profile) {
    return (
      <div className="rounded-2xl bg-white border border-border p-10 text-center text-sm text-[color:var(--slate-blue)]">
        <Loader2 className="h-5 w-5 mx-auto animate-spin text-[color:var(--royal)]" />
        <div className="mt-3">Loading your profile…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-border p-10 text-center text-sm text-[color:var(--deep)]">
        <AlertTriangle className="h-5 w-5 mx-auto text-[color:var(--royal)]" />
        <div className="mt-3 font-semibold">Couldn't load profile</div>
        <div className="mt-1 text-[color:var(--slate-blue)]">{error}</div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 space-y-6">
        <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[color:var(--deep)]">Resume</h2>
            {resumeName && (
              <button
                onClick={() => {
                  setResumeName(null);
                  setResumeText("");
                }}
                className="text-xs text-[color:var(--slate-blue)] hover:text-[color:var(--royal)]"
              >
                Replace
              </button>
            )}
          </div>

          {!resumeName ? (
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
                if (f) void handleFile(f);
              }}
              className={`mt-4 block cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
                dragOver
                  ? "border-[color:var(--royal)] bg-[color:var(--ice)]"
                  : "border-border bg-[color:var(--ice)]/40 hover:bg-[color:var(--ice)]"
              }`}
            >
              <input
                type="file"
                className="hidden"
                accept=".txt,.md,.pdf,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <div className="mx-auto h-14 w-14 rounded-full grid place-items-center bg-white border border-border">
                <Upload className="h-6 w-6 text-[color:var(--royal)]" />
              </div>
              <div className="mt-4 font-semibold text-[color:var(--deep)]">Drop your resume here</div>
              <div className="mt-1 text-sm text-[color:var(--slate-blue)]">TXT or MD parses instantly · PDF/DOCX: paste text</div>
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
                <div className="font-semibold text-[color:var(--deep)] truncate">{resumeName}</div>
                <div className="text-xs text-[color:var(--slate-blue)]">
                  {resumeText ? `${resumeText.length.toLocaleString()} chars stored` : "No text yet — paste below"}
                </div>
              </div>
              {resumeText && <CheckCircle2 className="h-5 w-5 text-[color:var(--royal)]" />}
            </div>
          )}

          {uploadErr && (
            <div className="mt-3 text-xs text-[color:var(--royal)]">{uploadErr}</div>
          )}

          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
              Resume text
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={8}
              maxLength={100_000}
              placeholder="Paste the plain text of your resume here so the analyzer can use it…"
              className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--royal)] resize-none"
            />
            <div className="mt-1 text-right text-xs text-[color:var(--slate-blue)]">
              {resumeText.length.toLocaleString()} / 100,000
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-border p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Skills</h3>
            <span className="text-xs text-[color:var(--slate-blue)]">{skills.length} listed</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--ice)] border border-border px-3 py-1 text-xs font-medium text-[color:var(--slate-blue)]"
              >
                {s}
                <button
                  onClick={() => setSkills((cur) => cur.filter((x) => x !== s))}
                  className="hover:text-[color:var(--royal)]"
                  aria-label={`Remove ${s}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = newSkill.trim().slice(0, 40);
                if (v) {
                  setSkills((cur) => Array.from(new Set([...cur, v])));
                  setNewSkill("");
                }
              }}
              className="inline-flex items-center gap-1"
            >
              <input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add skill"
                maxLength={40}
                className="rounded-full border border-border bg-white px-3 py-1 text-xs outline-none focus:border-[color:var(--royal)] w-28"
              />
              <button
                type="submit"
                className="h-7 w-7 grid place-items-center rounded-full bg-[color:var(--royal)] text-white"
                aria-label="Add skill"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <aside className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl bg-white border border-border p-6">
          <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Profile</h3>
          <div className="mt-4 space-y-4">
            <Field label="Full name" value={fullName} onChange={setFullName} />
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
                Target region
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] outline-none focus:border-[color:var(--royal)]"
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
                Email
              </label>
              <div className="mt-2 rounded-md border border-border bg-[color:var(--ice)] px-3 py-2 text-sm text-[color:var(--slate-blue)]">
                {profile?.email}
              </div>
            </div>
            <button
              onClick={save}
              disabled={saving || !profile}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] hover:bg-[color:var(--ocean)] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saveMsg && (
              <div className="text-xs text-[color:var(--slate-blue)] text-center">{saveMsg}</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl p-6 text-white" style={{ background: "var(--gradient-blue)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80">
            <Globe2 className="h-3.5 w-3.5" /> Regional snapshot
          </div>
          <div className="mt-3 text-2xl font-bold">{region || "Set a region"}</div>
          <p className="mt-2 text-sm text-white/80">
            The analyzer weights timezone overlap, visa needs, and regional demand against every JD you audit.
          </p>
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
        maxLength={120}
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] outline-none focus:border-[color:var(--royal)]"
      />
    </div>
  );
}

/* ============== Analyzer View ============== */

function AnalyzerView({
  profile,
  onComplete,
}: {
  profile: Profile | null;
  onComplete: () => Promise<void>;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [jd, setJd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<AnalysisRow | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resumeReady = !!(profile?.resume_text && profile.resume_text.trim().length >= 20);
  const canSubmit = company.trim() && role.trim() && jd.trim().length > 30 && resumeReady;

  async function run() {
    if (!profile) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expired. Please sign in again.");

      const res = await supabase.functions.invoke("analyze-suitability", {
        body: {
          resume_text: profile.resume_text,
          job_description: jd,
          company_name: company,
          job_title: role,
          target_region: profile.target_region ?? "",
        },
      });

      if (res.error) {
        // res.error may hide the response body; fall back to generic
        throw new Error(res.error.message || "Analysis failed");
      }
      const analysis = (res.data as { analysis?: AnalysisRow })?.analysis;
      if (!analysis) throw new Error("No analysis returned");
      setResult(analysis);
      setStatus("done");
      await onComplete();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Analysis failed");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-6">
      {!resumeReady && (
        <div className="rounded-2xl border border-[color:var(--royal)]/30 bg-[color:var(--ice)] p-4 text-sm text-[color:var(--deep)] flex items-start gap-3">
          <FileText className="h-5 w-5 text-[color:var(--royal)] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Add your resume first</div>
            <div className="text-[color:var(--slate-blue)] text-xs mt-1">
              Head to <span className="font-semibold">My Profile & Resume</span> and paste your resume text so the analyzer has something to score.
            </div>
          </div>
        </div>
      )}

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
                maxLength={200}
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
                maxLength={200}
                className="flex-1 bg-transparent py-2 text-sm outline-none"
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Job description</label>
          <textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={7}
            maxLength={20_000}
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
      {status === "error" && (
        <div className="rounded-2xl border border-[color:var(--royal)]/30 bg-white p-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-[color:var(--royal)] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[color:var(--deep)]">Analysis failed</div>
            <div className="mt-1 text-sm text-[color:var(--slate-blue)]">{errorMsg}</div>
          </div>
        </div>
      )}
      {status === "done" && result && <ResultPanel data={result} />}
    </div>
  );
}

function LoadingResult() {
  return (
    <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-[color:var(--royal)]" />
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

function ResultPanel({ data }: { data: AnalysisRow }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <ScoreRing value={data.match_score} size={120} />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-[color:var(--slate-blue)]">Verdict</div>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <VerdictBadge verdict={data.verdict} />
              <span className="text-2xl font-bold text-[color:var(--deep)]">{data.job_title}</span>
            </div>
            <div className="text-sm text-[color:var(--slate-blue)] mt-1">
              at <span className="font-semibold text-[color:var(--royal)]">{data.company_name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Column
          title="Strengths & Alignment"
          icon={CheckCircle2}
          items={data.strengths.length ? data.strengths : ["No specific strengths identified."]}
        />
        <Column
          title="Critical Gaps"
          icon={AlertTriangle}
          items={data.gaps.length ? data.gaps : ["No blocking gaps detected."]}
        />
      </div>

      {(data.regional_fit || data.upskilling_steps.length > 0) && (
        <div className="rounded-2xl p-6 text-white" style={{ background: "var(--gradient-blue)" }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80">
            <Globe2 className="h-3.5 w-3.5" /> Market & Regional Fit
          </div>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <RegionStat icon={Clock} label="Timezone" value={data.regional_fit?.split(".")[0] ?? "—"} />
            <RegionStat icon={TrendingUp} label="Regional analysis" value={data.regional_fit ?? "—"} />
            <RegionStat
              icon={MapPin}
              label="Upskilling"
              value={data.upskilling_steps.slice(0, 3).join(" · ") || "None recommended"}
            />
          </div>
        </div>
      )}

      {data.upskilling_steps.length > 0 && (
        <div className="rounded-2xl bg-white border border-border p-6">
          <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Upskilling Plan</h3>
          <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-[color:var(--slate-blue)]">
            {data.upskilling_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  const lower = verdict.toLowerCase();
  let bg = "var(--ocean)";
  let color = "#fff";
  let border: string | undefined;
  if (lower.includes("highly") || lower === "recommended" || lower === "go") {
    bg = "var(--royal)";
  } else if (lower.includes("not") || lower.includes("no-go")) {
    bg = "#fff";
    color = "var(--royal)";
    border = "1px solid var(--royal)";
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase"
      style={{ background: bg, color, border }}
    >
      {verdict}
    </span>
  );
}

function Column({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof CheckCircle2;
  items: string[];
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md grid place-items-center bg-[color:var(--ice)]">
          <Icon className="h-4 w-4 text-[color:var(--royal)]" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">{title}</h3>
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((i, idx) => (
          <li key={idx} className="border-l-2 border-[color:var(--royal)] pl-4 text-sm text-[color:var(--slate-blue)]">
            {i}
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
      <div className="mt-2 text-sm leading-relaxed text-white line-clamp-3">{value}</div>
    </div>
  );
}

/* ============== History View ============== */

function HistoryView({
  items,
  loading,
  error,
  onDeleted,
}: {
  items: AnalysisRow[];
  loading: boolean;
  error: string | null;
  onDeleted: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const verdicts = useMemo(() => {
    const set = new Set<string>();
    items.forEach((r) => set.add(r.verdict));
    return ["all", ...Array.from(set)];
  }, [items]);

  const rows = useMemo(() => {
    return items.filter((r) => {
      const okQ = q ? (r.company_name + " " + r.job_title).toLowerCase().includes(q.toLowerCase()) : true;
      const okF = filter === "all" ? true : r.verdict === filter;
      return okQ && okF;
    });
  }, [items, q, filter]);

  async function del(id: string) {
    setBusyId(id);
    try {
      const { error } = await supabase.from("analysis_history").delete().eq("id", id);
      if (error) throw error;
      await onDeleted();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-border p-10 text-center text-sm text-[color:var(--slate-blue)]">
        <Loader2 className="h-5 w-5 mx-auto animate-spin text-[color:var(--royal)]" />
        <div className="mt-3">Loading history…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-border p-10 text-center text-sm text-[color:var(--deep)]">
        <AlertTriangle className="h-5 w-5 mx-auto text-[color:var(--royal)]" />
        <div className="mt-3 font-semibold">Couldn't load history</div>
        <div className="mt-1 text-[color:var(--slate-blue)]">{error}</div>
      </div>
    );
  }

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
        <div className="flex items-center gap-1 rounded-md border border-border p-1 overflow-x-auto">
          <Filter className="h-3.5 w-3.5 text-[color:var(--slate-blue)] mx-1 shrink-0" />
          {verdicts.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
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

      {items.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-[color:var(--ice)]">
            <BarChart3 className="h-5 w-5 text-[color:var(--royal)]" />
          </div>
          <div className="mt-4 font-semibold text-[color:var(--deep)]">No analyses yet</div>
          <div className="mt-1 text-sm text-[color:var(--slate-blue)]">Run your first audit from the Analyzer tab.</div>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[color:var(--ice)] text-left text-xs uppercase tracking-wider text-[color:var(--slate-blue)]">
              <th className="px-5 py-3 font-semibold">Company</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Score</th>
              <th className="px-5 py-3 font-semibold">Verdict</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-[color:var(--ice)]/50">
                <td className="px-5 py-4 font-semibold text-[color:var(--deep)]">{r.company_name}</td>
                <td className="px-5 py-4 text-[color:var(--slate-blue)]">{r.job_title}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 rounded-full bg-[color:var(--ice)] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${r.match_score}%`, background: "var(--gradient-blue)" }}
                      />
                    </div>
                    <span className="font-semibold text-[color:var(--royal)]">{r.match_score}</span>
                  </div>
                </td>
                <td className="px-5 py-4"><VerdictBadge verdict={r.verdict} /></td>
                <td className="px-5 py-4 text-[color:var(--slate-blue)]">
                  {new Date(r.created_at).toISOString().slice(0, 10)}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => del(r.id)}
                    disabled={busyId === r.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)] hover:text-[color:var(--royal)] disabled:opacity-40"
                    aria-label="Delete"
                  >
                    {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[color:var(--slate-blue)]">
                  No analyses match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
