import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid,
  User,
  History,
  
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
  RefreshCw,
  Camera,
  ClipboardList,
} from "lucide-react";
import { getNames } from "country-list";
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
  country: string | null;
  city: string | null;
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

const COUNTRY_NAMES: string[] = getNames().sort((a, b) => a.localeCompare(b));

type View = "analyzer" | "profile" | "history" | "applications";

export type Stage =
  | "applied"
  | "preparing_test"
  | "preparing_interview"
  | "interview_scheduled"
  | "denied"
  | "offer";

export const STAGE_LABEL: Record<Stage, string> = {
  applied: "Applied",
  preparing_test: "Preparing for Test",
  preparing_interview: "Preparing for Interview",
  interview_scheduled: "Interview Scheduled",
  denied: "Denied",
  offer: "Offer",
};

export const STAGES_ORDERED: Stage[] = [
  "applied",
  "preparing_test",
  "preparing_interview",
  "interview_scheduled",
  "offer",
  "denied",
];

export type JobApplication = {
  id: string;
  user_id: string;
  analysis_id: string;
  stage: Stage;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

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
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [trackerError, setTrackerError] = useState<string | null>(null);

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

  const loadTracker = useCallback(async () => {
    setTrackerLoading(true);
    setTrackerError(null);
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setApplications((data as JobApplication[]) ?? []);
    } catch (e) {
      setTrackerError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setTrackerLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadHistory();
    loadTracker();
  }, [loadProfile, loadHistory, loadTracker]);

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
        onAvatarUpdated={loadProfile}
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
              applications={applications}
              loading={historyLoading}
              error={historyError}
              onDeleted={loadHistory}
              onApplicationChanged={loadTracker}
            />
          )}
          {view === "applications" && (
            <ApplicationsView
              applications={applications}
              analyses={history}
              loading={trackerLoading}
              error={trackerError}
              onChanged={loadTracker}
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

function locationLabel(p: Profile | null): string {
  if (!p) return "";
  return [p.city, p.country].filter(Boolean).join(", ");
}

const AVATAR_ACCEPT = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function Sidebar({
  view,
  setView,
  profile,
  loading,
  onSignOut,
  onAvatarUpdated,
}: {
  view: View;
  setView: (v: View) => void;
  profile: Profile | null;
  loading: boolean;
  onSignOut: () => void;
  onAvatarUpdated: () => void;
}) {
  const items: { key: View; label: string; icon: typeof LayoutGrid }[] = [
    { key: "analyzer", label: "Suitability Analyzer", icon: LayoutGrid },
    { key: "profile", label: "My Profile & Resume", icon: User },
    { key: "applications", label: "My Applications", icon: ClipboardList },
    { key: "history", label: "Analysis History", icon: History },
  ];
  const name = profile?.full_name || profile?.email?.split("@")[0] || "Signed in";
  const loc = locationLabel(profile);
  const sub = loc || profile?.email || "Set your location";

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [signedAvatar, setSignedAvatar] = useState<string | null>(null);

  // Resolve avatar_url (which stores a storage PATH) to a signed URL for the private bucket.
  useEffect(() => {
    let cancelled = false;
    const raw = profile?.avatar_url ?? null;
    if (!raw) {
      setSignedAvatar(null);
      return;
    }
    if (/^https?:\/\//i.test(raw)) {
      setSignedAvatar(raw);
      return;
    }
    (async () => {
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(raw, 60 * 60 * 24 * 7);
      if (!cancelled && !error && data) setSignedAvatar(data.signedUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.avatar_url]);

  const displayAvatar = preview || signedAvatar;

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError(null);
    if (!AVATAR_ACCEPT.includes(file.type)) {
      setUploadError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setUploadError("Image must be 2MB or smaller.");
      return;
    }
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
      const uid = userData.user.id;
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${uid}/avatar.${ext}`;
      // Remove any existing avatar files to prevent duplicates across extensions.
      const { data: existing } = await supabase.storage.from("avatars").list(uid);
      if (existing && existing.length > 0) {
        const toRemove = existing.map((o) => `${uid}/${o.name}`);
        await supabase.storage.from("avatars").remove(toRemove);
      }
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (upErr) throw upErr;
      // Persist the storage PATH in the DB — signed URLs are generated on read.
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", uid);
      if (updErr) throw updErr;
      onAvatarUpdated();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => {
        setPreview((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }, 800);
    }
  }


  return (
    <aside className="w-72 shrink-0 bg-white border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            {displayAvatar ? (
              <img
                src={displayAvatar}
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
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[color:var(--royal)] text-white grid place-items-center border-2 border-white hover:bg-[color:var(--ocean)] transition-colors disabled:opacity-70"
            >
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={onFileSelected}
              className="hidden"
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[color:var(--deep)] truncate">
              {loading ? "Loading…" : name}
            </div>
            <div className="text-xs text-[color:var(--slate-blue)] truncate">{sub}</div>
          </div>
        </div>
        {uploadError && (
          <div className="mt-3 text-xs text-[color:var(--royal)] bg-[color:var(--ice)] border border-[color:var(--royal)]/20 rounded-md px-3 py-2">
            {uploadError}
          </div>
        )}
      </div>

      <nav className="p-3 flex-1 space-y-1 overflow-y-auto">
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
  const meta: Record<View, { title: string; sub: string }> = {
    analyzer: {
      title: "Suitability Analyzer",
      sub: "Paste a job description and let the agent decide if it's worth applying.",
    },
    profile: {
      title: "My Profile & Resume",
      sub: "Upload your resume and set your location for tailored matching.",
    },
    history: {
      title: "Analysis History",
      sub: "Every audit you've run. Mark the ones you actually applied to.",
    },
    applications: {
      title: "My Applications",
      sub: "Track every application from applied through offer.",
    },
  };
  const { title, sub } = meta[view];
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

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_EXTS = /\.(pdf|docx|txt|md)$/i;

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
  const [country, setCountry] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [replaceMode, setReplaceMode] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setCountry(profile.country ?? "");
    setCity(profile.city ?? "");
    setSkills(profile.skills ?? []);
    setResumeText(profile.resume_text ?? "");
    setResumeName(profile.resume_name);
  }, [profile]);

  const hasSavedResume = !!(profile?.resume_text && profile.resume_text.trim().length >= 20);
  const showUploader = !hasSavedResume || replaceMode;

  async function persistResume(text: string, filename: string | null) {
    if (!profile) return;
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ resume_text: text || null, resume_name: filename })
      .eq("id", profile.id);
    if (upErr) throw upErr;
    await onSaved();
  }

  async function handleFile(file: File) {
    setUploadErr(null);

    if (!ACCEPTED_EXTS.test(file.name)) {
      setUploadErr("Only PDF, DOCX, TXT, or MD files are supported.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadErr(`File exceeds ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB limit.`);
      return;
    }
    if (file.size === 0) {
      setUploadErr("That file is empty.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await supabase.functions.invoke("extract-resume-text", { body: form });
      if (res.error) {
        // Try to surface any JSON error body the function returned
        let msg = res.error.message || "Extraction failed";
        const ctx = (res.error as { context?: Response }).context;
        if (ctx && typeof ctx.text === "function") {
          try {
            const body = await ctx.text();
            const parsed = JSON.parse(body);
            if (parsed?.error) msg = parsed.error;
          } catch {
            // ignore
          }
        }
        setUploadErr(msg);
        setPasteMode(true);
        return;
      }
      const data = res.data as { text?: string; filename?: string } | null;
      const text = (data?.text ?? "").trim();
      if (!text) {
        setUploadErr("No readable text found. Paste your resume text manually.");
        setPasteMode(true);
        return;
      }
      setResumeText(text);
      setResumeName(data?.filename ?? file.name);
      await persistResume(text, data?.filename ?? file.name);
      setReplaceMode(false);
      setPasteMode(false);
      setSaveMsg("Resume saved.");
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Extraction failed");
      setPasteMode(true);
    } finally {
      setUploading(false);
    }
  }

  async function savePastedResume() {
    if (!profile) return;
    const text = resumeText.trim();
    if (text.length < 40) {
      setUploadErr("Please paste at least a few sentences of your resume.");
      return;
    }
    setUploading(true);
    setUploadErr(null);
    try {
      const name = resumeName ?? "resume.txt";
      await persistResume(text, name);
      setResumeName(name);
      setReplaceMode(false);
      setPasteMode(false);
      setSaveMsg("Resume saved.");
      setTimeout(() => setSaveMsg(null), 2500);
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          country: country || null,
          city: city.trim() || null,
          skills,
        })
        .eq("id", profile.id);
      if (upErr) throw upErr;
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

  const savedSnippet = (profile?.resume_text ?? "").trim().slice(0, 260);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <section className="lg:col-span-3 space-y-6">
        <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[color:var(--deep)]">Resume</h2>
            {hasSavedResume && !replaceMode && (
              <button
                onClick={() => {
                  setReplaceMode(true);
                  setPasteMode(false);
                  setUploadErr(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--royal)] hover:text-[color:var(--ocean)]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Update resume
              </button>
            )}
            {replaceMode && (
              <button
                onClick={() => {
                  setReplaceMode(false);
                  setPasteMode(false);
                  setUploadErr(null);
                  setResumeText(profile?.resume_text ?? "");
                  setResumeName(profile?.resume_name ?? null);
                }}
                className="text-xs text-[color:var(--slate-blue)] hover:text-[color:var(--royal)]"
              >
                Cancel
              </button>
            )}
          </div>

          {hasSavedResume && !replaceMode ? (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-[color:var(--ice)] p-4">
                <div className="h-10 w-10 rounded-md grid place-items-center bg-white border border-border">
                  <FileText className="h-5 w-5 text-[color:var(--royal)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[color:var(--deep)] truncate">
                    {profile?.resume_name ?? "resume.txt"}
                  </div>
                  <div className="text-xs text-[color:var(--slate-blue)]">
                    Saved · {(profile?.resume_text ?? "").length.toLocaleString()} characters
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[color:var(--royal)]" />
              </div>
              {savedSnippet && (
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)] mb-2">
                    Preview
                  </div>
                  <p className="text-sm text-[color:var(--slate-blue)] whitespace-pre-wrap line-clamp-6">
                    {savedSnippet}
                    {(profile?.resume_text ?? "").length > savedSnippet.length ? "…" : ""}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {!pasteMode ? (
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
                  } ${uploading ? "pointer-events-none opacity-60" : ""}`}
                >
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <div className="mx-auto h-14 w-14 rounded-full grid place-items-center bg-white border border-border">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-[color:var(--royal)] animate-spin" />
                    ) : (
                      <Upload className="h-6 w-6 text-[color:var(--royal)]" />
                    )}
                  </div>
                  <div className="mt-4 font-semibold text-[color:var(--deep)]">
                    {uploading ? "Extracting text…" : "Drop your resume here"}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--slate-blue)]">
                    PDF, DOCX, TXT or MD · up to 5 MB
                  </div>
                  <div className="mt-5 inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2 text-xs font-semibold text-white">
                    Browse files
                  </div>
                </label>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-border bg-[color:var(--ice)] p-4 text-sm text-[color:var(--slate-blue)]">
                    Paste the plain text of your resume below and click Save.
                  </div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={10}
                    maxLength={100_000}
                    placeholder="Paste your resume text…"
                    className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--royal)] resize-none"
                  />
                  <div className="flex items-center justify-between text-xs text-[color:var(--slate-blue)]">
                    <button
                      onClick={() => {
                        setPasteMode(false);
                        setUploadErr(null);
                      }}
                      className="hover:text-[color:var(--royal)]"
                    >
                      ← Back to upload
                    </button>
                    <span>{resumeText.length.toLocaleString()} / 100,000</span>
                  </div>
                  <button
                    onClick={savePastedResume}
                    disabled={uploading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] hover:bg-[color:var(--ocean)] disabled:opacity-50 transition-colors"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save resume"}
                  </button>
                </div>
              )}

              {!pasteMode && (
                <div className="mt-3 text-center">
                  <button
                    onClick={() => {
                      setPasteMode(true);
                      setUploadErr(null);
                    }}
                    className="text-xs text-[color:var(--slate-blue)] hover:text-[color:var(--royal)] underline"
                  >
                    Or paste your resume text manually
                  </button>
                </div>
              )}
            </>
          )}

          {uploadErr && (
            <div className="mt-3 rounded-md border border-[color:var(--royal)]/30 bg-[color:var(--ice)] p-3 text-xs text-[color:var(--deep)]">
              <AlertTriangle className="inline h-3.5 w-3.5 mr-1 text-[color:var(--royal)]" />
              {uploadErr}
            </div>
          )}
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
                Country
              </label>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  if (!e.target.value) setCity("");
                }}
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] outline-none focus:border-[color:var(--royal)]"
              >
                <option value="">Select a country…</option>
                {COUNTRY_NAMES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
                City
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!country}
                maxLength={120}
                placeholder={country ? `Your city in ${country}` : "Pick a country first"}
                className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] outline-none focus:border-[color:var(--royal)] disabled:bg-[color:var(--ice)] disabled:cursor-not-allowed disabled:text-[color:var(--slate-blue)]"
              />
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
              onClick={saveProfile}
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
          <div className="mt-3 text-2xl font-bold">
            {[city, country].filter(Boolean).join(", ") || "Set a location"}
          </div>
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
          country: profile.country ?? "",
          city: profile.city ?? "",
        },
      });

      if (res.error) {
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
              Head to <span className="font-semibold">My Profile & Resume</span> and upload or paste your resume so the analyzer has something to score.
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
          <Link
            to="/history/$id"
            params={{ id: data.id }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-[color:var(--royal)] hover:bg-[color:var(--ice)]"
          >
            Open detail <ChevronRight className="h-3.5 w-3.5" />
          </Link>
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

export function VerdictBadge({ verdict }: { verdict: string }) {
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
  applications,
  loading,
  error,
  onDeleted,
  onApplicationChanged,
}: {
  items: AnalysisRow[];
  applications: JobApplication[];
  loading: boolean;
  error: string | null;
  onDeleted: () => Promise<void>;
  onApplicationChanged: () => Promise<void>;
}) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [applyBusyId, setApplyBusyId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const appByAnalysis = useMemo(() => {
    const map = new Map<string, JobApplication>();
    for (const a of applications) map.set(a.analysis_id, a);
    return map;
  }, [applications]);

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
      const { error: dErr } = await supabase.from("analysis_history").delete().eq("id", id);
      if (dErr) throw dErr;
      await onDeleted();
      await onApplicationChanged();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setBusyId(null);
    }
  }

  async function markApplied(analysisId: string) {
    setApplyBusyId(analysisId);
    setLocalError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
      const { error: insErr } = await supabase.from("job_applications").insert({
        user_id: userData.user.id,
        analysis_id: analysisId,
        stage: "applied",
      });
      if (insErr) throw insErr;
      await onApplicationChanged();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to mark applied");
    } finally {
      setApplyBusyId(null);
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
      {localError && (
        <div className="px-5 py-3 border-b border-border bg-[color:var(--ice)] text-sm text-[color:var(--royal)]">
          {localError}
        </div>
      )}
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
              <th className="px-5 py-3 font-semibold">Applied?</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const app = appByAnalysis.get(r.id);
              return (
                <tr
                  key={r.id}
                  className="border-t border-border hover:bg-[color:var(--ice)]/50"
                >
                  <td
                    className="px-5 py-4 font-semibold text-[color:var(--deep)] cursor-pointer"
                    onClick={() => nav({ to: "/history/$id", params: { id: r.id } })}
                  >
                    {r.company_name}
                  </td>
                  <td
                    className="px-5 py-4 text-[color:var(--slate-blue)] cursor-pointer"
                    onClick={() => nav({ to: "/history/$id", params: { id: r.id } })}
                  >
                    {r.job_title}
                  </td>
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
                  <td className="px-5 py-4">
                    {app ? (
                      <Link
                        to="/applications/$id"
                        params={{ id: app.id }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--royal)] text-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:bg-[color:var(--ocean)]"
                      >
                        {STAGE_LABEL[app.stage]}
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={applyBusyId === r.id}
                        onClick={() => markApplied(r.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--royal)]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[color:var(--royal)] hover:bg-[color:var(--ice)] disabled:opacity-60"
                      >
                        {applyBusyId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        I applied
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[color:var(--slate-blue)]">
                    {new Date(r.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void del(r.id);
                      }}
                      disabled={busyId === r.id}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[color:var(--slate-blue)] hover:bg-[color:var(--ice)] hover:text-[color:var(--royal)] disabled:opacity-40"
                      aria-label="Delete"
                    >
                      {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-[color:var(--slate-blue)]">
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

/* ============== Applications View ============== */

function ApplicationsView({
  applications,
  analyses,
  loading,
  error,
  onChanged,
}: {
  applications: JobApplication[];
  analyses: AnalysisRow[];
  loading: boolean;
  error: string | null;
  onChanged: () => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");

  const analysisById = useMemo(() => {
    const map = new Map<string, AnalysisRow>();
    for (const a of analyses) map.set(a.id, a);
    return map;
  }, [analyses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter((a) => {
      if (stageFilter !== "all" && a.stage !== stageFilter) return false;
      const analysis = analysisById.get(a.analysis_id);
      if (!q) return true;
      if (!analysis) return false;
      return (
        analysis.company_name.toLowerCase().includes(q) ||
        analysis.job_title.toLowerCase().includes(q)
      );
    });
  }, [applications, analysisById, query, stageFilter]);

  async function changeStage(app: JobApplication, next: Stage) {
    if (app.stage === next) return;
    setBusyId(app.id);
    setLocalError(null);
    try {
      const { error: err } = await supabase
        .from("job_applications")
        .update({ stage: next, updated_at: new Date().toISOString() })
        .eq("id", app.id);
      if (err) throw err;
      await onChanged();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to update stage");
    } finally {
      setBusyId(null);
    }
  }

  async function removeApp(app: JobApplication) {
    setBusyId(app.id);
    setLocalError(null);
    try {
      const { error: err } = await supabase.from("job_applications").delete().eq("id", app.id);
      if (err) throw err;
      await onChanged();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {(error || localError) && (
        <div className="rounded-lg border border-[color:var(--royal)]/20 bg-white p-4 text-sm text-[color:var(--royal)]">
          {error || localError}
        </div>
      )}
      <div className="rounded-xl border border-border bg-white p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--slate-blue)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company or role"
            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-white text-sm text-[color:var(--deep)] focus:outline-none focus:border-[color:var(--royal)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[color:var(--slate-blue)]" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as Stage | "all")}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] focus:outline-none focus:border-[color:var(--royal)]"
          >
            <option value="all">All stages</option>
            {STAGES_ORDERED.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--ice)] text-[color:var(--slate-blue)] text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Company</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Match</th>
              <th className="text-left px-4 py-3">Verdict</th>
              <th className="text-left px-4 py-3">Stage</th>
              <th className="text-left px-4 py-3">Updated</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[color:var(--slate-blue)]">
                  <Loader2 className="h-4 w-4 inline animate-spin mr-2" />
                  Loading applications…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-[color:var(--slate-blue)]">
                  No applications yet. On the Analysis History tab, mark a role as applied.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((app) => {
                const analysis = analysisById.get(app.analysis_id);
                return (
                  <tr key={app.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-medium text-[color:var(--deep)]">
                        <Building2 className="h-4 w-4 text-[color:var(--slate-blue)]" />
                        {analysis?.company_name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--slate-blue)]">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[color:var(--slate-blue)]" />
                        {analysis?.job_title ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {analysis ? (
                        <span className="font-semibold text-[color:var(--royal)]">{analysis.match_score}</span>
                      ) : (
                        <span className="text-[color:var(--slate-blue)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {analysis ? <VerdictBadge verdict={analysis.verdict} /> : <span className="text-[color:var(--slate-blue)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={busyId === app.id}
                        value={app.stage}
                        onChange={(e) => changeStage(app, e.target.value as Stage)}
                        className="rounded-md border border-border bg-white px-2 py-1.5 text-xs text-[color:var(--deep)] focus:outline-none focus:border-[color:var(--royal)]"
                      >
                        {STAGES_ORDERED.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-[color:var(--slate-blue)] text-xs">
                      {new Date(app.updated_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to="/applications/$id"
                          params={{ id: app.id }}
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--royal)] hover:bg-[color:var(--ice)]"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === app.id}
                          onClick={() => removeApp(app)}
                          aria-label="Remove application"
                          className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1.5 text-xs text-[color:var(--slate-blue)] hover:text-[color:var(--royal)] hover:bg-[color:var(--ice)] disabled:opacity-60"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

