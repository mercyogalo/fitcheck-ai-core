// extract-resume-text: authenticated edge function that accepts a resume file
// (PDF, DOCX, TXT, MD) as multipart/form-data and returns the extracted plain
// text. Runs server-side to sidestep the browser's inability to parse binary
// document formats without shipping large libraries.
import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";
import mammoth from "https://esm.sh/mammoth@1.8.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_CHARS = 100_000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_CHARS);
}

async function extractFromPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return typeof text === "string" ? text : Array.isArray(text) ? text.join("\n\n") : "";
}

async function extractFromDocx(bytes: Uint8Array): Promise<string> {
  const result = await mammoth.extractRawText({
    arrayBuffer: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  return result?.value ?? "";
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

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("multipart/form-data")) {
      return jsonResponse({ error: "Expected multipart/form-data" }, 400);
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonResponse({ error: "Invalid form data" }, 400);
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonResponse({ error: "Missing 'file' field" }, 400);
    }
    if (file.size === 0) {
      return jsonResponse({ error: "Uploaded file is empty" }, 400);
    }
    if (file.size > MAX_BYTES) {
      return jsonResponse({ error: `File exceeds ${MAX_BYTES / (1024 * 1024)} MB limit` }, 413);
    }

    const name = (file.name || "resume").toLowerCase();
    const mime = (file.type || "").toLowerCase();
    const isPdf = mime === "application/pdf" || name.endsWith(".pdf");
    const isDocx =
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      name.endsWith(".docx");
    const isTxt = mime.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md");

    if (!isPdf && !isDocx && !isTxt) {
      return jsonResponse(
        { error: "Unsupported file type. Upload a PDF, DOCX, TXT, or MD file." },
        415,
      );
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    let text = "";
    try {
      if (isPdf) text = await extractFromPdf(buf);
      else if (isDocx) text = await extractFromDocx(buf);
      else text = new TextDecoder("utf-8").decode(buf);
    } catch (err) {
      console.error("extract failed", err);
      return jsonResponse(
        {
          error:
            "We couldn't read that file — it may be corrupted, password-protected, or a scanned image. Try re-exporting it or paste the text manually.",
        },
        422,
      );
    }

    const cleaned = cleanText(text);
    if (cleaned.length < 40) {
      return jsonResponse(
        {
          error:
            "We extracted very little text — this often means the file is scanned images rather than selectable text. Paste your resume text manually.",
        },
        422,
      );
    }

    return jsonResponse({
      text: cleaned,
      filename: file.name,
      chars: cleaned.length,
    });
  } catch (err) {
    console.error("extract-resume-text fatal", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
