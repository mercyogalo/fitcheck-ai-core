import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Globe2,
  BookOpen,
  Loader2,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScoreRing } from "../index";
import { VerdictBadge } from "./dashboard";

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

export const Route = createFileRoute("/_authenticated/history/$id")({
  head: () => ({
    meta: [
      { title: "Analysis detail — FitCheck AI" },
      { name: "description", content: "Full breakdown of a previous suitability analysis." },
    ],
  }),
  component: HistoryDetail,
});

function HistoryDetail() {
  const { id } = useParams({ from: "/_authenticated/history/$id" });
  const [row, setRow] = useState<AnalysisRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw userErr ?? new Error("Not signed in");
      const { data, error: qErr } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("id", id)
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (qErr) throw qErr;
      if (!data) {
        setNotFound(true);
        return;
      }
      setRow(data as AnalysisRow);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white border border-border p-14 text-center text-sm text-[color:var(--slate-blue)]">
          <Loader2 className="h-5 w-5 mx-auto animate-spin text-[color:var(--royal)]" />
          <div className="mt-3">Loading analysis…</div>
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white border border-border p-14 text-center text-sm">
          <AlertTriangle className="h-5 w-5 mx-auto text-[color:var(--royal)]" />
          <div className="mt-3 font-semibold text-[color:var(--deep)]">Couldn't load analysis</div>
          <div className="mt-1 text-[color:var(--slate-blue)]">{error}</div>
        </div>
      </Shell>
    );
  }

  if (notFound || !row) {
    return (
      <Shell>
        <div className="rounded-2xl bg-white border border-border p-14 text-center">
          <div className="mx-auto h-12 w-12 rounded-full grid place-items-center bg-[color:var(--ice)]">
            <FileText className="h-5 w-5 text-[color:var(--royal)]" />
          </div>
          <div className="mt-4 font-semibold text-[color:var(--deep)]">Analysis not found</div>
          <div className="mt-1 text-sm text-[color:var(--slate-blue)]">
            It may have been deleted, or the link points to another user's analysis.
          </div>
          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--ocean)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </div>
      </Shell>
    );
  }

  const created = new Date(row.created_at);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="rounded-2xl bg-white border border-border p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <ScoreRing value={row.match_score} size={128} />
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-wider text-[color:var(--slate-blue)]">Verdict</div>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <VerdictBadge verdict={row.verdict} />
                <h1 className="text-2xl font-bold text-[color:var(--deep)] truncate">{row.job_title}</h1>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[color:var(--slate-blue)]">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[color:var(--royal)]" />
                  <span className="font-semibold text-[color:var(--deep)]">{row.company_name}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-[color:var(--royal)]" /> {row.job_title}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[color:var(--royal)]" />
                  {created.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <ListCard title="Strengths & Alignment" icon={CheckCircle2} items={row.strengths} empty="No specific strengths recorded." />
          <ListCard title="Critical Gaps" icon={AlertTriangle} items={row.gaps} empty="No blocking gaps recorded." />
        </div>

        {row.regional_fit && (
          <div className="rounded-2xl p-6 text-white" style={{ background: "var(--gradient-blue)" }}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80">
              <Globe2 className="h-3.5 w-3.5" /> Market & Regional Fit
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/95 whitespace-pre-wrap">{row.regional_fit}</p>
          </div>
        )}

        {row.upskilling_steps.length > 0 && (
          <div className="rounded-2xl bg-white border border-border p-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md grid place-items-center bg-[color:var(--ice)]">
                <BookOpen className="h-4 w-4 text-[color:var(--royal)]" />
              </div>
              <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Upskilling Plan</h3>
            </div>
            <ol className="mt-4 space-y-2 list-decimal list-inside text-sm text-[color:var(--slate-blue)]">
              {row.upskilling_steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="rounded-2xl bg-white border border-border p-6">
          <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">Original job description</h3>
          <pre className="mt-4 whitespace-pre-wrap font-sans text-sm text-[color:var(--slate-blue)] leading-relaxed">
            {row.job_description}
          </pre>
        </div>
      </div>
    </Shell>
  );
}

function ListCard({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: typeof CheckCircle2;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-border p-6">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md grid place-items-center bg-[color:var(--ice)]">
          <Icon className="h-4 w-4 text-[color:var(--royal)]" />
        </div>
        <h3 className="font-display text-lg font-semibold text-[color:var(--deep)]">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[color:var(--slate-blue)] italic">{empty}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((it, idx) => (
            <li key={idx} className="border-l-2 border-[color:var(--royal)] pl-4 text-sm text-[color:var(--slate-blue)]">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--ice)]">
      <div className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--royal)] hover:text-[color:var(--ocean)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
          <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">
            Analysis detail
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}
