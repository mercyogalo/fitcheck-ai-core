// deno-lint-ignore-file no-explicit-any
// analyze-suitability: authenticated edge function that scores a resume
// against a job description via the Lovable AI Gateway and persists the
// verdict into analysis_history as the requesting user (RLS-respecting).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
// LOVABLE_API_KEY is auto-provisioned by Lovable Cloud (server-side only).
// If the user wanted a BYO key they'd set AI_API_KEY via `supabase secrets set`.
const AI_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? Deno.env.get("AI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_LEN = 20_000;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitize(input: unknown, cap = MAX_LEN): string {
  if (typeof input !== "string") return "";
  // strip control chars, trim, cap length
  return input
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, cap);
}

type AnalysisPayload = {
  match_score: number;
  verdict: string;
  strengths: string[];
  gaps: string[];
  regional_fit: string;
  upskilling_steps: string[];
};

function isValidAnalysis(obj: any): obj is AnalysisPayload {
  return (
    obj &&
    typeof obj === "object" &&
    Number.isInteger(obj.match_score) &&
    obj.match_score >= 0 &&
    obj.match_score <= 100 &&
    typeof obj.verdict === "string" &&
    obj.verdict.length > 0 &&
    Array.isArray(obj.strengths) &&
    obj.strengths.every((s: unknown) => typeof s === "string") &&
    Array.isArray(obj.gaps) &&
    obj.gaps.every((s: unknown) => typeof s === "string") &&
    typeof obj.regional_fit === "string" &&
    Array.isArray(obj.upskilling_steps) &&
    obj.upskilling_steps.every((s: unknown) => typeof s === "string")
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return jsonResponse({ error: "Missing bearer token" }, 401);

    // Client scoped to the caller — inserts go through RLS as that user.
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = userData.user.id;

    // ---- Input validation ----
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const resume_text = sanitize(body?.resume_text);
    const job_description = sanitize(body?.job_description);
    const company_name = sanitize(body?.company_name, 200);
    const job_title = sanitize(body?.job_title, 200);
    const country = sanitize(body?.country, 120);
    const city = sanitize(body?.city, 120);
    const region_label = [city, country].filter(Boolean).join(", ");

    if (!resume_text || resume_text.length < 20) {
      return jsonResponse({ error: "resume_text is missing or too short" }, 400);
    }
    if (!job_description || job_description.length < 20) {
      return jsonResponse({ error: "job_description is missing or too short" }, 400);
    }
    if (!company_name || !job_title) {
      return jsonResponse({ error: "company_name and job_title are required" }, 400);
    }

    // ---- Rate limiting hook ----
    // FOLLOW-UP: enforce per-user rate limits by counting recent rows in
    // analysis_history (e.g. > 20 in the last hour) once a shared limits
    // helper exists. Not implemented here to avoid ad-hoc rate limiting.

    if (!AI_API_KEY) {
      return jsonResponse({ error: "AI gateway not configured" }, 500);
    }

    // ---- LLM call ----
    const systemPrompt =
      "You are a rigorous career-fit analyst. Given a candidate resume and a job description, " +
      "return ONLY raw JSON (no markdown, no prose, no code fences) with this exact shape:\n" +
      '{"match_score": <int 0-100>, "verdict": "Highly Recommended"|"Recommended"|"Stretch"|"Not Recommended", ' +
      '"strengths": [string,...], "gaps": [string,...], "regional_fit": string, "upskilling_steps": [string,...]}';

    const userPrompt =
      `Candidate location: ${region_label || "unspecified"}\n\n` +
      `=== RESUME ===\n${resume_text}\n\n` +
      `=== JOB (${job_title} @ ${company_name}) ===\n${job_description}`;


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

    if (aiResp.status === 429) {
      return jsonResponse({ error: "Rate limit exceeded. Try again shortly." }, 429);
    }
    if (aiResp.status === 402) {
      return jsonResponse({ error: "AI credits exhausted. Please add credits." }, 402);
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text().catch(() => "");
      console.error("AI gateway error", aiResp.status, txt);
      return jsonResponse({ error: "AI gateway request failed" }, 502);
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") {
      return jsonResponse({ error: "AI returned no content" }, 502);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback: extract first JSON object substring
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return jsonResponse({ error: "AI response was not JSON" }, 502);
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        return jsonResponse({ error: "AI response was not valid JSON" }, 502);
      }
    }

    if (!isValidAnalysis(parsed)) {
      console.error("AI payload shape invalid", parsed);
      return jsonResponse({ error: "AI response failed schema validation" }, 502);
    }

    // ---- Persist ----
    const { data: inserted, error: insertErr } = await supabase
      .from("analysis_history")
      .insert({
        user_id: userId,
        company_name,
        job_title,
        job_description,
        match_score: parsed.match_score,
        verdict: parsed.verdict,
        strengths: parsed.strengths,
        gaps: parsed.gaps,
        regional_fit: parsed.regional_fit,
        upskilling_steps: parsed.upskilling_steps,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("insert error", insertErr);
      return jsonResponse({ error: "Failed to save analysis" }, 500);
    }

    return jsonResponse({ analysis: inserted });
  } catch (err) {
    console.error("analyze-suitability fatal", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
