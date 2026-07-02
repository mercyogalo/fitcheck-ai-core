import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  Loader2,
  FileText,
  BookOpen,
  MessageSquare,
  Save,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STAGE_LABEL, STAGES_ORDERED, VerdictBadge, type Stage } from "./dashboard";

type Analysis = {
  id: string;
  company_name: string;
  job_title: string;
  job_description: string;
  match_score: number;
  verdict: string;
};

type JobApplication = {
  id: string;
  user_id: string;
  analysis_id: string;
  stage: Stage;
  notes: string | null;
  updated_at: string;
  created_at: string;
  analysis: Analysis | null;
};

type TestPrep = {
  kind: "test_prep";
  topics: string[];
  focus_areas: string[];
  suggested_resources: string[];
};

type InterviewPrep = {
  kind: "interview_prep";
  likely_questions: { question: string; angle: string }[];
  behavioral_themes: string[];
  smart_talking_points: string[];
};

type Recommendation = TestPrep | InterviewPrep;

export const Route = createFileRoute("/_authenticated/applications/$id")({
  component: ApplicationDetail,
});

function ApplicationDetail() {
  const { id } = useParams({ from: "/_authenticated/applications/$id" });
  const [app, setApp] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [stageBusy, setStageBusy] = useState(false);

  const [rec, setRec] = useState<Recommendation | null>(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
      const { data, error: err } = await supabase
        .from("job_applications")
        .select(
          "id, user_id, analysis_id, stage, notes, updated_at, created_at, analysis:analysis_history!inner(id, company_name, job_title, job_description, match_score, verdict)",
        )
        .eq("id", id)
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (err) throw err;
      if (!data) {
        setApp(null);
      } else {
        const raw = data as unknown as {
          id: string;
          user_id: string;
          analysis_id: string;
          stage: Stage;
          notes: string | null;
          updated_at: string;
          created_at: string;
          analysis: Analysis | Analysis[] | null;
        };
        const analysis = Array.isArray(raw.analysis) ? raw.analysis[0] ?? null : raw.analysis;
        setApp({ ...raw, analysis });
        setNotes(raw.notes ?? "");

        // Hydrate any previously-generated recommendation for the current stage.
        const { data: cached } = await supabase
          .from("stage_recommendations")
          .select("payload, stage")
          .eq("application_id", raw.id)
          .eq("stage", raw.stage)
          .maybeSingle();
        if (cached?.payload) {
          setRec(cached.payload as unknown as Recommendation);
        } else {
          setRec(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load application");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStage(next: Stage) {
    if (!app || app.stage === next) return;
    setStageBusy(true);
    try {
      const { error: err } = await supabase
        .from("job_applications")
        .update({ stage: next, updated_at: new Date().toISOString() })
        .eq("id", app.id);
      if (err) throw err;
      setApp({ ...app, stage: next });
      setRecError(null);
      // Load any recommendation previously saved for this new stage.
      const { data: cached } = await supabase
        .from("stage_recommendations")
        .select("payload")
        .eq("application_id", app.id)
        .eq("stage", next)
        .maybeSingle();
      setRec(cached?.payload ? (cached.payload as unknown as Recommendation) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update stage");
    } finally {
      setStageBusy(false);
    }
  }

  async function saveNotes() {
    if (!app) return;
    setSavingNotes(true);
    try {
      const { error: err } = await supabase
        .from("job_applications")
        .update({ notes, updated_at: new Date().toISOString() })
        .eq("id", app.id);
      if (err) throw err;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function fetchRecommendations(regenerate = false) {
    if (!app) return;
    setRecLoading(true);
    setRecError(null);
    try {
      const { data, error: err } = await supabase.functions.invoke(
        "get-stage-recommendations",
        { body: { application_id: app.id, regenerate } },
      );
      if (err) throw err;
      const payload = data as { recommendations?: Recommendation };
      if (!payload?.recommendations) throw new Error("No recommendation returned");
      setRec(payload.recommendations);
    } catch (e) {
      setRecError(e instanceof Error ? e.message : "Failed to fetch recommendations");
    } finally {
      setRecLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[color:var(--ice)]">
        <div className="text-[color:var(--slate-blue)] flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading application…
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen bg-[color:var(--ice)] p-8">
        <div className="max-w-3xl mx-auto rounded-xl border border-border bg-white p-10 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--ice)] text-[color:var(--slate-blue)] mb-3">
            <ClipboardList className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-[color:var(--deep)]">Application not found</h1>
          <p className="text-sm text-[color:var(--slate-blue)] mt-2">
            {error || "This application either doesn't exist or belongs to another account."}
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--ocean)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const canRecommend =
    app.stage === "preparing_test" ||
    app.stage === "preparing_interview" ||
    app.stage === "interview_scheduled";

  const analysis = app.analysis;

  return (
    <div className="min-h-screen bg-[color:var(--ice)]">
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-8 py-6 flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--slate-blue)] hover:text-[color:var(--royal)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="text-xs text-[color:var(--slate-blue)] flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Updated {new Date(app.updated_at).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="rounded-xl border border-border bg-white p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--ocean)] flex items-center gap-1">
            <Building2 className="h-3 w-3" /> {analysis?.company_name ?? "Unknown company"}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-[color:var(--deep)] flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[color:var(--royal)]" />
            {analysis?.job_title ?? "Unknown role"}
          </h1>
          {analysis && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <VerdictBadge verdict={analysis.verdict} />
              <span className="text-sm text-[color:var(--slate-blue)]">
                Match score:{" "}
                <span className="font-semibold text-[color:var(--royal)]">{analysis.match_score}</span>
              </span>
              <Link
                to="/history/$id"
                params={{ id: analysis.id }}
                className="text-xs text-[color:var(--royal)] hover:text-[color:var(--ocean)] font-semibold underline"
              >
                View original analysis
              </Link>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
              Stage
            </label>
            <select
              value={app.stage}
              disabled={stageBusy}
              onChange={(e) => changeStage(e.target.value as Stage)}
              className="rounded-md border border-border bg-white px-3 py-2 text-sm text-[color:var(--deep)] focus:outline-none focus:border-[color:var(--royal)]"
            >
              {STAGES_ORDERED.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            {stageBusy && <Loader2 className="h-4 w-4 animate-spin text-[color:var(--slate-blue)]" />}
          </div>
        </div>

        {analysis && (
          <div className="rounded-xl border border-border bg-white p-6">
            <div className="flex items-center gap-2 text-[color:var(--deep)] font-semibold">
              <FileText className="h-4 w-4 text-[color:var(--royal)]" /> Job description
            </div>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-[color:var(--slate-blue)] font-sans">
              {analysis.job_description}
            </pre>
          </div>
        )}

        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[color:var(--deep)] font-semibold">
              <MessageSquare className="h-4 w-4 text-[color:var(--royal)]" /> Notes
            </div>
            <button
              type="button"
              onClick={saveNotes}
              disabled={savingNotes}
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--ocean)] disabled:opacity-60"
            >
              {savingNotes ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save notes
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Recruiter names, timelines, thoughts after each call…"
            className="mt-3 w-full rounded-md border border-border bg-white p-3 text-sm text-[color:var(--deep)] focus:outline-none focus:border-[color:var(--royal)]"
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[color:var(--deep)] font-semibold">
              <BookOpen className="h-4 w-4 text-[color:var(--royal)]" /> Preparation recommendations
            </div>
            <button
              type="button"
              onClick={fetchRecommendations}
              disabled={!canRecommend || recLoading}
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--royal)]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--royal)] hover:bg-[color:var(--ice)] disabled:opacity-60"
            >
              {recLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {rec ? "Regenerate" : "Generate"}
            </button>
          </div>

          {!canRecommend && (
            <p className="mt-3 text-sm text-[color:var(--slate-blue)]">
              Move this application to <span className="font-medium">Preparing for Test</span>,{" "}
              <span className="font-medium">Preparing for Interview</span>, or{" "}
              <span className="font-medium">Interview Scheduled</span> to unlock tailored guidance.
            </p>
          )}

          {recError && (
            <div className="mt-3 rounded-md border border-[color:var(--royal)]/20 bg-[color:var(--ice)] p-3 text-sm text-[color:var(--royal)]">
              {recError}
            </div>
          )}

          {rec && rec.kind === "test_prep" && (
            <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
              <RecList title="Topics" items={rec.topics} />
              <RecList title="Focus areas" items={rec.focus_areas} />
              <RecList title="Suggested resources" items={rec.suggested_resources} />
            </div>
          )}

          {rec && rec.kind === "interview_prep" && (
            <div className="mt-4 space-y-4">
              {rec.behavioral_themes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)] mb-2">
                    Behavioral themes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {rec.behavioral_themes.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-medium text-[color:var(--royal)] bg-[color:var(--ice)] border border-[color:var(--royal)]/20 rounded-full px-2.5 py-1"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {rec.likely_questions.map((q, i) => (
                  <div key={i} className="rounded-lg border border-border bg-[color:var(--ice)] p-4">
                    <div className="font-semibold text-[color:var(--deep)] text-sm">
                      {i + 1}. {q.question}
                    </div>
                    <div className="mt-2 text-sm text-[color:var(--slate-blue)]">
                      <span className="font-semibold text-[color:var(--royal)]">Angle:</span> {q.angle}
                    </div>
                  </div>
                ))}
              </div>
              {rec.smart_talking_points.length > 0 && (
                <RecList title="Smart talking points" items={rec.smart_talking_points} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-[color:var(--ice)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-[color:var(--deep)]">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--royal)] shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
