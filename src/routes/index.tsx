import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  FileText,
  Gauge,
  Globe2,
  GraduationCap,
  Target,
  Layers,
  ShieldCheck,
  CircleDot,
  X,
} from "lucide-react";



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitCheck AI — Audit your resume before you apply" },
      { name: "description", content: "An agentic AI that scores your fit for any role: hiring probability, regional compliance, and skill gaps in seconds." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [demoOpen, setDemoOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onWatchDemo={() => setDemoOpen(true)} />
      <Hero onWatchDemo={() => setDemoOpen(true)} />
      <About />
      <Features />
      <CtaBand />
      <Footer />
      {demoOpen && <DemoVideoModal onClose={() => setDemoOpen(false)} />}
    </div>
  );
}

function Navbar({ onWatchDemo }: { onWatchDemo: () => void }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display font-bold tracking-tight text-[color:var(--deep)]">
            FitCheck<span className="text-[color:var(--ocean)]">AI</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[color:var(--slate-blue)]">
          <a href="#about" className="hover:text-[color:var(--royal)] transition-colors">About</a>
          <a href="#features" className="hover:text-[color:var(--royal)] transition-colors">Features</a>
          <button type="button" onClick={onWatchDemo} className="hover:text-[color:var(--royal)] transition-colors">Demo</button>
          <Link to="/dashboard" className="hover:text-[color:var(--royal)] transition-colors">Dashboard</Link>
        </nav>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-blue)] hover:bg-[color:var(--ocean)] transition-colors"
        >
          Get Started <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function LogoMark() {
  return (
    <div className="h-8 w-8 rounded-md grid place-items-center" style={{ background: "var(--gradient-blue)" }}>
      <Target className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
    </div>
  );
}

function Hero({ onWatchDemo }: { onWatchDemo: () => void }) {
  return (
    <section id="top" className="pt-32 pb-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--royal)]/20 bg-white px-3 py-1 text-xs font-medium text-[color:var(--royal)]">
            <CircleDot className="h-3 w-3" /> Agentic resume auditing
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl font-bold leading-[1.05] text-[color:var(--deep)]">
            Stop wasting time on applications that don't fit.
          </h1>
          <p className="mt-5 text-lg md:text-xl text-[color:var(--slate-blue)] max-w-2xl">
            Let an AI agent audit your resume against any job description instantly calculating real hiring probability, regional compliance, and the exact gaps standing between you and the offer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-[color:var(--royal)] px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-blue)] hover:bg-[color:var(--ocean)] transition-colors"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onWatchDemo}
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--royal)]/30 bg-white px-6 py-3 text-sm font-semibold text-[color:var(--royal)] hover:bg-[color:var(--ice)] transition-colors"
            >
              <Play className="h-4 w-4" /> Watch Demo
            </button>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
            {[
              { k: "94%", v: "Match accuracy" },
              { k: "3s", v: "Avg. audit" },
              { k: "40+", v: "Regions modeled" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-3xl font-bold text-[color:var(--royal)]">{s.k}</div>
                <div className="text-xs text-[color:var(--slate-blue)] mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl" style={{ background: "var(--gradient-blue)" }} />
      <div className="relative rounded-2xl bg-white border border-border shadow-[var(--shadow-card)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-[color:var(--slate-blue)]">Live Audit</div>
            <div className="font-semibold text-[color:var(--deep)] mt-1">Senior Backend Engineer · Stripe</div>
          </div>
          <ScoreRing value={82} />
        </div>
        <div className="mt-6 space-y-3">
          {[
            { label: "Core skills alignment", v: 92 },
            { label: "Years of experience", v: 78 },
            { label: "Regional / visa fit", v: 64 },
            { label: "Domain familiarity", v: 88 },
          ].map((b) => (
            <div key={b.label}>
              <div className="flex justify-between text-xs text-[color:var(--slate-blue)] mb-1">
                <span>{b.label}</span>
                <span className="font-semibold text-[color:var(--royal)]">{b.v}%</span>
              </div>
              <div className="h-2 rounded-full bg-[color:var(--ice)] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${b.v}%`, background: "var(--gradient-blue)" }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-lg bg-[color:var(--ice)] px-3 py-2 text-xs text-[color:var(--slate-blue)]">
          <ShieldCheck className="h-4 w-4 text-[color:var(--royal)]" />
          Recommendation: <span className="font-semibold text-[color:var(--royal)]">Apply with tailored cover letter</span>
        </div>
      </div>
    </div>
  );
}

export function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--ice)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--royal)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-lg font-bold text-[color:var(--royal)]">{value}</span>
      </div>
    </div>
  );
}

function About() {
  return (
    <section id="about" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-[color:var(--ocean)]">Our mission</div>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[color:var(--deep)]">
              Replace blind applying with intentional, evidence-backed targeting.
            </h2>
            <p className="mt-5 text-lg text-[color:var(--slate-blue)]">
              The average job seeker fires off 100+ applications a month with a single resume burning weeks of energy on roles where they were never a real fit. FitCheck AI is the agentic filter between you and the apply button.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-25 blur-2xl" style={{ background: "var(--gradient-blue)" }} />
            <img
              src="https://s3.amazonaws.com/shecodesio-production/uploads/files/000/180/693/original/ChatGPT_Image_Jul_1__2026__05_03_39_PM.png?1782914640"
              alt="Person reviewing a resume at a laptop while preparing a job application"
              width={1280}
              height={960}
              loading="lazy"
              className="relative rounded-2xl border border-border shadow-[var(--shadow-card)] w-full h-auto object-cover"
            />
          </div>
        </div>

        <div className="mt-14 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-[color:var(--ice)] p-8">
            <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--slate-blue)]">Before FitCheck</div>
            <h3 className="mt-3 text-2xl font-bold text-[color:var(--deep)]">Spray-and-pray</h3>
            <ul className="mt-5 space-y-3 text-sm text-[color:var(--slate-blue)]">
              {["Same resume sent to every role", "No signal on real fit or visa eligibility", "Hours lost on rejections you could have predicted", "Skill gaps discovered only after interview"].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--slate-blue)] shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-8 text-white" style={{ background: "var(--gradient-blue)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider text-white/70">With FitCheck</div>
            <h3 className="mt-3 text-2xl font-bold">Targeted & intentional</h3>
            <ul className="mt-5 space-y-3 text-sm text-white/90">
              {["Per-role hiring probability score", "Regional, timezone & visa compliance check", "Concrete strengths and gaps in seconds", "Upskilling plan to close the closest gaps"].map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: FileText, title: "Resume Parsing", desc: "Structured extraction of skills, years, domains and tooling from any PDF or DOCX resume." },
    { icon: Gauge, title: "Hiring Probability", desc: "A calibrated score predicting how likely you are to clear screening for this exact role." },
    { icon: Globe2, title: "Regional & Visa Fit", desc: "Timezone overlap, work-authorization needs, and hiring-market signals per region." },
    { icon: GraduationCap, title: "Upskilling Recommendations", desc: "Ranked actions courses, projects, certs to close the gaps that matter most." },
    { icon: Layers, title: "JD Decomposition", desc: "The agent breaks the JD into must-haves, nice-to-haves, and unspoken expectations." },
    { icon: ShieldCheck, title: "Decision Confidence", desc: "Go / No-Go recommendation with full reasoning trail you can audit yourself." },
  ];
  return (
    <section id="features" className="py-24 bg-[color:var(--ice)]">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold uppercase tracking-wider text-[color:var(--ocean)]">Features</div>
          <h2 className="mt-3 text-4xl md:text-5xl font-bold text-[color:var(--deep)]">An agent that reads the JD the way a hiring manager does.</h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white border border-border p-6 hover:shadow-[var(--shadow-card)] transition-shadow">
              <div className="h-10 w-10 rounded-lg grid place-items-center bg-[color:var(--ice)] border border-border">
                <f.icon className="h-5 w-5 text-[color:var(--royal)]" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-[color:var(--deep)]">{f.title}</h3>
              <p className="mt-2 text-sm text-[color:var(--slate-blue)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="rounded-3xl px-10 py-14 text-center" style={{ background: "var(--gradient-blue)" }}>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Audit your next application in seconds.</h2>
          <p className="mt-3 text-white/85">Drop your resume, paste a JD, and let the agent decide if it's worth your evening.</p>
          <Link
            to="/dashboard"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-[color:var(--royal)] hover:bg-[color:var(--ice)] transition-colors"
          >
            Open Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[color:var(--deep)] text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display font-bold text-white">FitCheck<span className="text-[color:var(--ocean)]">AI</span></span>
          </div>
          <p className="mt-4 text-sm text-white/60 leading-relaxed">
            The agentic filter between you and the apply button.
          </p>
        </div>
        <FooterCol title="Product" links={[{ label: "About", href: "#about" }, { label: "Features", href: "#features" }, { label: "Dashboard", href: "/dashboard" }]} />
        <FooterCol title="Docs" links={[{ label: "Getting started", href: "#" }, { label: "API reference", href: "#" }, { label: "Changelog", href: "#" }]} />
        <FooterCol title="Hackathon" links={[{ label: "Project brief", href: "#" }, { label: "Team", href: "#" }, { label: "Submission", href: "#" }]} />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <div>© {new Date().getFullYear()} FitCheck AI </div>
         
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <div className="text-sm font-semibold text-white">{title}</div>
      <ul className="mt-4 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-white/60 hover:text-white transition-colors">{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemoVideoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="FitCheck AI demo video"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[color:var(--deep)]/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-black shadow-[var(--shadow-card)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 grid place-items-center rounded-full bg-white text-[color:var(--deep)] hover:bg-[color:var(--ice)] transition-colors"
          aria-label="Close demo video"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="aspect-video w-full">
          <iframe
            title="FitCheck AI demo"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&playsinline=1"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
