import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Target, Mail, Lock, ArrowRight, AlertCircle, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FitCheck AI" },
      { name: "description", content: "Sign in to run resume-vs-JD audits and view your history." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) nav({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) nav({ to: "/dashboard" });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex flex-col justify-between p-12 text-white" style={{ background: "var(--gradient-blue)" }}>
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="h-8 w-8 rounded-md grid place-items-center bg-white/15">
            <Target className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold tracking-tight">FitCheck AI</span>
        </Link>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight">Stop applying blind.</h2>
          <p className="mt-4 text-white/85 max-w-md">
            Sign in to audit your resume against any job description, track your history, and get a real hiring probability score.
          </p>
        </div>
        <div className="text-xs text-white/70">© {new Date().getFullYear()} FitCheck AI</div>
      </div>

      <div className="flex flex-col justify-center px-6 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--slate-blue)] hover:text-[color:var(--royal)]">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <h1 className="mt-6 font-display text-3xl font-bold text-[color:var(--deep)]">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--slate-blue)]">
            {mode === "signin"
              ? "Sign in to continue auditing job fits."
              : "Get started in seconds. No credit card required."}
          </p>

          <button
            onClick={onGoogle}
            disabled={loading}
            className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--deep)] hover:bg-[color:var(--ice)] transition-colors disabled:opacity-50"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-[color:var(--slate-blue)]">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  maxLength={120}
                  className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--royal)]"
                  placeholder="Amina Otieno"
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Email</label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border px-3">
                <Mail className="h-4 w-4 text-[color:var(--slate-blue)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={255}
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                  placeholder="you@company.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Password</label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border px-3">
                <Lock className="h-4 w-4 text-[color:var(--slate-blue)]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  className="flex-1 bg-transparent py-2 text-sm outline-none"
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-[color:var(--royal)]/30 bg-[color:var(--ice)] p-3 text-xs text-[color:var(--deep)]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[color:var(--royal)] mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-blue)] hover:bg-[color:var(--ocean)] disabled:opacity-50 transition-colors"
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[color:var(--slate-blue)]">
            {mode === "signin" ? "New to FitCheck?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="font-semibold text-[color:var(--royal)] hover:underline"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.29 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
