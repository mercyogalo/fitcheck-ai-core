// deno-lint-ignore-file no-explicit-any
// get-stage-recommendations: authenticated edge function that returns
// stage-specific preparation guidance for a job_applications row via the
// Lovable AI Gateway. RLS-scoped read of the application + profile.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const AI_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? Deno.env.get("AI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STAGES = new Set([
  "applied",
  "preparing_test",
  "preparing_interview",
  "interview_scheduled",
  "denied",
  "offer",
]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

type Payload = TestPrep | InterviewPrep;

function isTestPrep(o: any): o is TestPrep {
  return (
    o &&
    o.kind === "test_prep" &&
    Array.isArray(o.topics) &&
    o.topics.every((s: unknown) => typeof s === "string") &&
    Array.isArray(o.focus_areas) &&
    o.focus_areas.every((s: unknown) => typeof s === "string") &&
    Array.isArray(o.suggested_resources) &&
    o.suggested_resources.every((s: unknown) => typeof s === "string")
  );
}

function isInterviewPrep(o: any): o is InterviewPrep {
  return (
    o &&
    o.kind === "interview_prep" &&
    Array.isArray(o.likely_questions) &&
    o.likely_questions.every(
      (q: any) => q && typeof q.question === "string" && typeof q.angle === "string",
    ) &&
    Array.isArray(o.behavioral_themes) &&
    o.behavioral_themes.every((s: unknown) => typeof s === "string") &&
    Array.isArray(o.smart_talking_points) &&
    o.smart_talking_points.every((s: unknown) => typeof s === "string")
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return jsonResponse({ error: "Missing bearer token" }, 401);

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return jsonResponse({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }
    const applicationId = typeof body?.application_id === "string" ? body.application_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(applicationId)) {
      return jsonResponse({ error: "application_id (uuid) is required" }, 400);
    }

    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("id, user_id, stage, analysis_id, analysis:analysis_history!inner(id, company_name, job_title, job_description)")
      .eq("id", applicationId)
      .eq("user_id", userId)
      .maybeSingle();
    if (appErr) return jsonResponse({ error: "Failed to load application" }, 500);
    if (!app) return jsonResponse({ error: "Application not found" }, 404);
    if (!STAGES.has(app.stage)) return jsonResponse({ error: "Invalid stage" }, 400);

    const analysisRaw = (app as any).analysis;
    const analysis = Array.isArray(analysisRaw) ? analysisRaw[0] : analysisRaw;
    if (!analysis) return jsonResponse({ error: "Linked analysis not found" }, 404);

    const relevantStages = new Set(["preparing_test", "preparing_interview", "interview_scheduled"]);
    if (!relevantStages.has(app.stage)) {
      return jsonResponse({
        error: "Recommendations are only available for test or interview preparation stages.",
      }, 400);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("resume_text, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!AI_API_KEY) return jsonResponse({ error: "AI gateway not configured" }, 500);

    const isTest = app.stage === "preparing_test";
    const systemPrompt = isTest
      ? "You are a technical coach. Given a job description, return ONLY raw JSON with this exact shape (no markdown, no prose):\n" +
        '{"kind":"test_prep","topics":[string,...],"focus_areas":[string,...],"suggested_resources":[string,...]}'
      : "You are an interview coach. Given a resume and a job description, return ONLY raw JSON with this exact shape (no markdown, no prose):\n" +
        '{"kind":"interview_prep","likely_questions":[{"question":string,"angle":string},...],"behavioral_themes":[string,...],"smart_talking_points":[string,...]}';

    const resumeSnippet = (profile?.resume_text ?? "").slice(0, 8000);
    const userPrompt = isTest
      ? `=== JOB (${analysis.job_title} @ ${analysis.company_name}) ===\n${analysis.job_description}\n\nProvide 6-10 topics, 4-6 focus areas, 3-5 resources.`
      : `=== RESUME ===\n${resumeSnippet || "(candidate did not provide a resume)"}\n\n` +
        `=== JOB (${analysis.job_title} @ ${analysis.company_name}) ===\n${analysis.job_description}\n\n` +
        `Return 8-12 likely_questions with a suggested answer angle each, 4-6 behavioral_themes, and 4-6 smart_talking_points.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiResp.status === 429) return jsonResponse({ error: "Rate limit exceeded." }, 429);
    if (aiResp.status === 402) return jsonResponse({ error: "AI credits exhausted." }, 402);
    if (!aiResp.ok) {
      const txt = await aiResp.text().catch(() => "");
      console.error("AI gateway error", aiResp.status, txt);
      return jsonResponse({ error: "AI gateway request failed" }, 502);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") return jsonResponse({ error: "AI returned no content" }, 502);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return jsonResponse({ error: "AI response was not JSON" }, 502);
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return jsonResponse({ error: "AI response was not valid JSON" }, 502);
      }
    }

    const payload = parsed as Payload;
    if (isTest ? !isTestPrep(payload) : !isInterviewPrep(payload)) {
      console.error("AI payload shape invalid", parsed);
      return jsonResponse({ error: "AI response failed schema validation" }, 502);
    }

    return jsonResponse({ recommendations: payload, stage: app.stage });
  } catch (err) {
    console.error("get-stage-recommendations fatal", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
