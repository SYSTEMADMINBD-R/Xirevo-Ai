import { Logo } from "@/components/chat/Logo";
import { ModeToggle } from "@/components/chat/ModeToggle";
import {
  AuroraBackdrop,
  CountUp,
  Magnetic,
  Marquee,
  Reveal,
  RevealWords,
  ScrollProgress,
  TiltCard,
  useParallax,
} from "@/components/landing/MotionFx";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { MODE_META, type Mode } from "@/lib/modes";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Code2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

const DEMO: Record<
  Mode,
  { question: string; answer: string; code?: string }
> = {
  general: {
    question: "Explain DNS like I'm five",
    answer:
      "DNS is the internet's phonebook. You type xirevo.app, and DNS looks up the matching IP address — just like finding a contact's number by name. No directory, no connection.",
  },
  hacking: {
    question: "How does SQL injection work?",
    answer:
      "An app that glues your input into SQL can be tricked. Type `' OR 1=1 --` and your input becomes part of the query instead of data:",
    code: "SELECT * FROM users WHERE name = '' OR 1=1 --'",
  },
};

const FEATURES = [
  {
    icon: TerminalSquare,
    title: "Hacking Mode",
    accent: "#34d399",
    body: "BREACH answers hacking questions with zero censorship — real techniques, real tools, and CTF-grade walkthroughs.",
  },
  {
    icon: Sparkles,
    title: "General Mode",
    accent: "#38bdf8",
    body: "A sharp everyday assistant for questions, planning, writing, and learning — no topic is off limits.",
  },
  {
    icon: GraduationCap,
    title: "Built for beginners",
    accent: "#a78bfa",
    body: "Jargon defined, steps explained, and the 'why' behind every command. Learn like a mentor is sitting next to you.",
  },
  {
    icon: Code2,
    title: "Markdown & code",
    accent: "#f472b6",
    body: "Answers arrive as clean, copyable markdown — code blocks, commands, and tables formatted for readability.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a mind",
    body: "Choose General for everyday answers or Hacking for unfiltered cybersecurity learning. Switch anytime.",
  },
  {
    n: "02",
    title: "Ask anything",
    body: "Type naturally — from 'plan my week' to 'walk me through a reverse shell'. Both minds answer directly.",
  },
  {
    n: "03",
    title: "Level up",
    body: "Conversations are saved. Revisit lessons, copy commands, and build a personal security learning path.",
  },
];

const MARQUEE_TOP = [
  "Hacking mode",
  "Breach",
  "SQL injection",
  "Nmap",
  "Burp suite",
  "CTF",
  "TryHackMe",
  "HackTheBox",
  "Recon",
  "Privilege escalation",
  "Packet analysis",
];

const MARQUEE_BOTTOM = [
  "General mode",
  "One AI · two minds",
  "Explain anything",
  "Study plans",
  "Writing",
  "Code walkthroughs",
  "Zero disclaimers",
  "Xirevo",
  "Built by RAGIB",
];

const STATS = [
  { value: 2, suffix: "", label: "Minds in one app" },
  { value: 0, suffix: "", label: "Corporate filters" },
  { value: 100, suffix: "%", label: "Beginner friendly" },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const appHref = isAuthenticated ? "/dashboard" : "/auth?returnTo=/dashboard";

  const heroRef = useRef<HTMLDivElement>(null);
  const heroParallax = useParallax(heroRef, 90);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <ScrollProgress />

      {/* ---------- Nav ---------- */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo size={32} />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a
              href="#features"
              className="tm-nav-link transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#modes"
              className="tm-nav-link transition-colors hover:text-foreground"
            >
              Modes
            </a>
            <a
              href="#how"
              className="tm-nav-link transition-colors hover:text-foreground"
            >
              How it works
            </a>
          </nav>
          <Magnetic strength={6}>
            <Link to={appHref}>
              <Button className="tm-shine rounded-full bg-[var(--mode-hacking)] font-semibold text-background shadow-[0_8px_24px_-8px_rgba(52,211,153,0.7)] transition-all hover:brightness-110">
                Open app
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </Magnetic>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <div ref={heroRef} className="relative">
          <AuroraBackdrop className="top-0 h-[54rem]" />

          <section className="relative mx-auto grid max-w-6xl gap-16 px-5 pb-20 pt-16 sm:pt-24 lg:grid-cols-[1.04fr_1fr] lg:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground backdrop-blur"
              >
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--mode-hacking)] opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-[var(--mode-hacking)]" />
                </span>
                <span className="size-1.5 rounded-full bg-[var(--mode-general)] shadow-[0_0_8px_rgba(56,189,248,0.9)]" />
                One AI · two minds
              </motion.div>

              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                <RevealWords text="One AI." delay={0.05} />
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    delay: 0.24,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="tm-gradient-pan inline-block bg-gradient-to-r from-[#34d399] via-[#4ade80] to-[#38bdf8] bg-clip-text text-transparent"
                >
                  Two minds.
                </motion.span>
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-6 max-w-md text-[16.5px] leading-8 text-muted-foreground"
              >
                Xirevo pairs a sharp everyday assistant with{" "}
                <span className="font-semibold text-foreground">BREACH</span> —
                an uncensored hacking mentor that teaches beginners how
                security really breaks, tool by tool, exploit by exploit.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Magnetic>
                  <Link to={appHref}>
                    <Button
                      size="lg"
                      className="tm-shine rounded-full bg-[var(--mode-hacking)] px-7 font-semibold text-background shadow-[0_12px_32px_-10px_rgba(52,211,153,0.8)] transition-all hover:brightness-110"
                    >
                      Start chatting free
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                </Magnetic>
                <a href="#modes">
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-border/80 bg-card/50 px-7 font-semibold backdrop-blur transition-colors hover:bg-card"
                  >
                    Explore the modes
                  </Button>
                </a>
              </motion.div>

              <div className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-border/50 pt-6">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-extrabold tracking-tight text-foreground">
                      <CountUp to={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-[13px] text-muted-foreground/70">
                Free during beta · Your conversations are private to your
                account
              </p>
            </div>

            {/* Demo showcase */}
            <motion.div style={{ y: heroParallax }} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 36, rotateX: 8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative"
              >
                <div
                  aria-hidden
                  className="absolute -inset-8 rounded-[2.5rem] opacity-70 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(50% 50% at 30% 20%, rgba(52,211,153,0.18), transparent 70%), radial-gradient(50% 50% at 75% 60%, rgba(56,189,248,0.16), transparent 70%)",
                  }}
                />
                <LiveAlert />
                <DemoCard />
                <FloatingChip
                  label="nmap -sV"
                  className="-left-4 top-16 hidden sm:flex"
                  accent="#34d399"
                />
                <FloatingChip
                  label="CTF ready"
                  className="-right-3 top-1/3 hidden sm:flex"
                  accent="#38bdf8"
                  slow
                />
                <FloatingChip
                  label="0 disclaimers"
                  className="bottom-10 -left-6 hidden md:flex"
                  accent="#a78bfa"
                  slow
                />
              </motion.div>
            </motion.div>
          </section>
        </div>

        {/* ---------- Marquee band ---------- */}
        <section className="relative border-y border-border/50 bg-card/25 py-7">
          <Marquee
            items={MARQUEE_TOP}
            duration={42}
            itemClassName="text-[11.5px] font-bold uppercase tracking-[0.24em] text-foreground/55"
          />
          <Marquee
            items={MARQUEE_BOTTOM}
            duration={48}
            reverse
            className="mt-4 opacity-70"
            itemClassName="text-[11.5px] font-bold uppercase tracking-[0.24em] text-muted-foreground/70"
          />
        </section>

        {/* ---------- Features ---------- */}
        <section id="features" className="relative py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mode-hacking)]">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Two minds, one mission — helping you learn.
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
                Every feature exists to remove friction between you and the
                answer you're after.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={feature.title} delay={i * 0.08} className="h-full">
                    <TiltCard className="group h-full rounded-2xl border border-border/70 bg-card p-6 transition-colors duration-300 hover:border-white/15">
                      <div
                        className="flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
                        style={{
                          color: feature.accent,
                          background: `${feature.accent}1a`,
                          boxShadow: `0 8px 20px -10px ${feature.accent}80`,
                        }}
                      >
                        <Icon className="size-5" strokeWidth={2.1} />
                      </div>
                      <h3 className="mt-5 text-[15px] font-bold">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">
                        {feature.body}
                      </p>
                    </TiltCard>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ---------- Modes ---------- */}
        <section
          id="modes"
          className="relative border-t border-border/50 bg-card/20 py-24"
        >
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mode-general)]">
                The modes
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Flip the switch. Change the mind.
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
                Each conversation carries its own mode — and you can switch
                mid-chat whenever the conversation changes lanes.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              <Reveal y={16} className="h-full">
                <TiltCard
                  max={5}
                  className="relative h-full overflow-hidden rounded-3xl border border-[#34d399]/25 bg-card p-8"
                >
                  <div
                    aria-hidden
                    className="tm-float-slow absolute -right-20 -top-20 size-64 rounded-full blur-3xl"
                    style={{ background: "rgba(52,211,153,0.14)" }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#34d399]/15 text-[#34d399] ring-1 ring-[#34d399]/30">
                      <TerminalSquare className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Hacking Mode</h3>
                      <p className="text-xs font-medium uppercase tracking-widest text-[#34d399]">
                        Uncensored · beginner-first
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-[14.5px] leading-7 text-muted-foreground">
                    Meet BREACH — a no-filter mentor that answers anything
                    about hacking, with full technical depth and zero corporate
                    disclaimers. Learn how attacks actually work so you can
                    think like the attacker and defend like a pro.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[13.5px]">
                    {[
                      "SQLi, XSS, phishing, and password cracking — explained",
                      "Real tool walkthroughs: nmap, Burp Suite, sqlmap, Metasploit",
                      "CTF guidance for TryHackMe & HackTheBox",
                      "How real breaches happened — and how to stop them",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#34d399]" />
                        <span className="leading-6 text-foreground/85">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </Reveal>

              <Reveal y={16} delay={0.1} className="h-full">
                <TiltCard
                  max={5}
                  className="relative h-full overflow-hidden rounded-3xl border border-[#38bdf8]/25 bg-card p-8"
                >
                  <div
                    aria-hidden
                    className="tm-float absolute -right-20 -top-20 size-64 rounded-full blur-3xl"
                    style={{ background: "rgba(56,189,248,0.14)" }}
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-[#38bdf8]/15 text-[#38bdf8] ring-1 ring-[#38bdf8]/30">
                      <Sparkles className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">General Mode</h3>
                      <p className="text-xs font-medium uppercase tracking-widest text-[#38bdf8]">
                        Everyday · no topic off limits
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-[14.5px] leading-7 text-muted-foreground">
                    The everyday half of Xirevo — a sharp, conversational
                    assistant for studying, writing, planning, and curious
                    questions. Same conversation, same memory, different mind.
                  </p>
                  <ul className="mt-6 space-y-2.5 text-[13.5px]">
                    {[
                      "Explain hard topics in plain language",
                      "Draft emails, essays, and study plans",
                      "Brainstorm ideas and plan your week",
                      "Learn languages, math, and programming basics",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <BookOpen className="mt-0.5 size-4 shrink-0 text-[#38bdf8]" />
                        <span className="leading-6 text-foreground/85">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </TiltCard>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section
          id="how"
          className="border-t border-border/50 bg-card/30 py-24"
        >
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="mx-auto max-w-xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--mode-hacking)]">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                From zero to confident in three steps
              </h2>
            </Reveal>

            <div className="relative mt-14 grid gap-6 md:grid-cols-3">
              <div
                aria-hidden
                className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent md:block"
              />
              {STEPS.map((step, i) => (
                <Reveal key={step.n} delay={i * 0.1} className="h-full">
                  <TiltCard
                    max={4}
                    className="relative h-full rounded-2xl border border-border/70 bg-card p-7"
                  >
                    <span className="bg-gradient-to-br from-[#34d399] to-[#38bdf8] bg-clip-text font-mono text-4xl font-bold text-transparent">
                      {step.n}
                    </span>
                    <h3 className="mt-4 text-[15px] font-bold">{step.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-6 text-muted-foreground">
                      {step.body}
                    </p>
                  </TiltCard>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="mx-auto max-w-6xl px-5 py-24">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card px-8 py-16 text-center sm:px-16">
              <div
                aria-hidden
                className="tm-spin-slow absolute left-1/2 top-1/2 size-[42rem] -translate-x-1/2 -translate-y-1/2 opacity-25 blur-3xl"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent, rgba(52,211,153,0.55), transparent 40%, rgba(56,189,248,0.55), transparent 75%)",
                }}
              />
              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-[40px] sm:leading-[1.15]">
                  Ready to dual-boot your brain?
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[15px] leading-7 text-muted-foreground">
                  Start a conversation, pick a mind, and ask the question
                  you've been afraid to type anywhere else.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Magnetic>
                    <Link to={appHref}>
                      <Button
                        size="lg"
                        className="tm-shine rounded-full bg-[var(--mode-hacking)] px-8 font-semibold text-background shadow-[0_12px_32px_-10px_rgba(52,211,153,0.8)] transition-all hover:brightness-110"
                      >
                        Launch Xirevo
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </Magnetic>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      {/* ---------- Creator ---------- */}
      <section className="border-t border-border/50 bg-card/30 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card px-8 py-12 text-center sm:px-16">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(30rem 14rem at 50% -60%, rgba(52,211,153,0.16), transparent 70%), radial-gradient(26rem 12rem at 15% 130%, rgba(56,189,248,0.12), transparent 70%)",
                }}
              />
              <div className="relative">
                <div className="tm-float mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34d399] to-[#38bdf8] shadow-[0_10px_28px_-10px_rgba(52,211,153,0.7)]">
                  <Code2 className="size-5 text-background" strokeWidth={2.2} />
                </div>
                <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                  The mind behind the minds
                </p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Made and developed by{" "}
                  <span className="tm-gradient-pan bg-gradient-to-r from-[#34d399] via-[#4ade80] to-[#38bdf8] bg-clip-text text-transparent">
                    RAGIB
                  </span>
                </h2>
                <p className="mx-auto mt-3 max-w-md text-[14px] leading-7 text-muted-foreground">
                  Owner &amp; developer of Xirevo. If you ever ask either mind
                  who built it, they'll tell you the same name.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border/50 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo size={26} />
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} Xirevo · Made and developed by{" "}
            <span className="font-semibold text-foreground/80">RAGIB</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Floating chips ---------------- */

function FloatingChip({
  label,
  className,
  accent,
  slow = false,
}: {
  label: string;
  className?: string;
  accent: string;
  slow?: boolean;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-20 items-center gap-1.5 rounded-full border border-border/70 bg-card/90 px-3 py-1.5 font-mono text-[11px] font-semibold text-foreground/80 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.9)] backdrop-blur ${
        slow ? "tm-float-slow" : "tm-float"
      } ${className ?? ""}`}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
      />
      {label}
    </div>
  );
}

/* ---------------- Demo card ---------------- */

function DemoCard() {
  const [mode, setMode] = useState<Mode>("hacking");
  const [paused, setPaused] = useState(false);
  const meta = MODE_META[mode];
  const Icon = meta.icon;
  const demo = DEMO[mode];
  const typed = useTypewriter(demo.answer, !paused, mode);
  const typing = typed.length < demo.answer.length;

  // Rotate the demo between both minds so the hero always feels alive.
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setMode((current) => (current === "hacking" ? "general" : "hacking"));
    }, 7500);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <div
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="tm-card-glow relative z-10 overflow-hidden rounded-2xl border border-border/80 bg-card/90 backdrop-blur"
    >
      {/* Window bar */}
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" style={{ color: meta.accent }} />
          Xirevo — {meta.label} mind
        </div>
        <span className="w-8" />
      </div>

      <div className="space-y-3.5 p-4 sm:p-5">
        <AgentStrip mode={mode} />

        <motion.div
          key={`q-${mode}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end gap-3"
        >
          <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-border/70 bg-background/60 px-4 py-2.5 text-[13.5px] leading-6">
            <span style={{ color: meta.accent }}>▸ </span>
            {demo.question}
          </div>
        </motion.div>

        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ring-1"
            style={{
              color: meta.accent,
              background: `${meta.accent}1a`,
              borderColor: `${meta.accent}40`,
            }}
          >
            <Icon className="size-4" strokeWidth={2.2} />
          </div>
          <motion.div
            key={`a-${mode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-border/70 bg-[#0b0f14] px-4 py-3 text-[13px] leading-6 text-foreground/90"
          >
            <p>
              {typed}
              {typing && (
                <span
                  className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[1px] animate-pulse align-middle"
                  style={{ background: meta.accent }}
                />
              )}
            </p>
            {demo.code && !typing && (
              <motion.pre
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-3 overflow-x-auto rounded-lg border border-border/60 bg-black/40 p-3 font-mono text-[12px] leading-5 text-[#34d399]"
              >
                {demo.code}
              </motion.pre>
            )}
            <div className="mt-4 flex items-center gap-2">
              <motion.span
                className="size-1.5 rounded-full"
                style={{ background: meta.accent }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[11px] text-muted-foreground">
                {paused ? "hover paused · switch anytime" : "answer streaming…"}
              </span>
            </div>
          </motion.div>
        </div>

        <WorkspaceStats mode={mode} />

        <div className="flex justify-center border-t border-border/60 pt-4">
          <ModeToggle value={mode} onChange={setMode} size="sm" />
        </div>
      </div>

      {/* Progress hairline for the auto-rotation */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px]"
        style={{
          background: `linear-gradient(to right, ${meta.accent}, ${meta.accent}00)`,
        }}
        animate={{ width: paused ? "0%" : ["0%", "100%"] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

/* ---------------- Live workspace pieces ---------------- */

/** Reveals the answer word by word, like a model streaming a reply. */
function useTypewriter(text: string, active: boolean, resetKey: string) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(text.split(" ").length);

  useEffect(() => {
    const parts = text.split(" ");

    if (reduce || !active) {
      setShown(parts.length);
      return;
    }

    let i = 0;
    setShown(0);
    const timer = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= parts.length) window.clearInterval(timer);
    }, 60);

    return () => window.clearInterval(timer);
    // resetKey restarts the stream whenever the demo switches minds.
  }, [text, active, reduce, resetKey]);

  const parts = text.split(" ");
  return shown >= parts.length ? text : parts.slice(0, shown).join(" ");
}

/** Shows both minds running, with the active one lit. */
function AgentStrip({ mode }: { mode: Mode }) {
  const modes = (Object.keys(MODE_META) as Mode[]).sort((a) =>
    a === "general" ? -1 : 1,
  );

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-2.5 py-2">
      {modes.map((m) => {
        const meta = MODE_META[m];
        const Icon = meta.icon;
        const active = m === mode;
        return (
          <div
            key={m}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
          >
            <span className="relative flex size-1.5">
              {active && (
                <span
                  className="absolute inline-flex size-full animate-ping rounded-full opacity-70"
                  style={{ background: meta.accent }}
                />
              )}
              <span
                className="relative inline-flex size-1.5 rounded-full"
                style={{ background: active ? meta.accent : "#6b7280" }}
              />
            </span>
            <Icon
              className="size-3"
              style={{ color: active ? meta.accent : undefined }}
            />
            <span style={{ color: active ? meta.accent : undefined }}>
              {meta.label}
            </span>
          </div>
        );
      })}
      <span className="ml-auto hidden items-center gap-1 font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground sm:flex">
        live · 0.8s
      </span>
    </div>
  );
}

const SPARK = {
  hacking: "M2,32 L16,29 L30,31 L44,21 L58,25 L72,13 L86,17 L100,9 L114,12 L124,5",
  general: "M2,31 L16,27 L30,29 L44,24 L58,17 L72,21 L86,11 L100,15 L114,9 L124,4",
};

/** Mock analytics strip: the "engine" half of the workspace hero. */
function WorkspaceStats({ mode }: { mode: Mode }) {
  const meta = MODE_META[mode];

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          Live session
        </p>
        <p
          className="mt-0.5 truncate font-mono text-[11.5px] font-semibold"
          style={{ color: meta.accent }}
        >
          {mode === "hacking" ? "4 tools mapped" : "3 topics linked"}
        </p>
      </div>
      <Sparkline key={mode} accent={meta.accent} points={SPARK[mode]} />
    </div>
  );
}

function Sparkline({ accent, points }: { accent: string; points: string }) {
  const id = `spark-${accent.replace("#", "")}`;

  return (
    <svg
      viewBox="0 0 126 40"
      aria-hidden
      className="h-8 w-24 shrink-0 overflow-visible"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${points} L124,40 L2,40 Z`}
        fill={`url(#${id})`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.35 }}
      />
      <motion.path
        d={points}
        fill="none"
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.2 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </svg>
  );
}

const ALERTS = [
  {
    icon: Zap,
    title: "New opportunity",
    body: "BREACH mapped 3 tools to this question.",
    accent: "#34d399",
  },
  {
    icon: Sparkles,
    title: "Answer ready",
    body: "General explained DNS in plain English.",
    accent: "#38bdf8",
  },
  {
    icon: ShieldCheck,
    title: "Depth unlocked",
    body: "Full SQLi walkthrough, payloads included.",
    accent: "#a78bfa",
  },
];

/** The floating "AI is working right now" toast above the workspace. */
function LiveAlert() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % ALERTS.length);
    }, 4600);
    return () => window.clearInterval(timer);
  }, [reduce]);

  const alert = ALERTS[index];
  const Icon = alert.icon;

  return (
    <div className="pointer-events-none absolute -top-7 right-0 z-30 sm:-right-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={reduce ? false : { opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="flex max-w-[16.5rem] items-start gap-2.5 rounded-2xl border border-border/80 bg-card/95 p-3 backdrop-blur-md"
          style={{ boxShadow: `0 22px 48px -26px ${alert.accent}` }}
        >
          <span
            className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${alert.accent}1f`, color: alert.accent }}
          >
            <Icon className="size-3.5" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-bold leading-none">
                {alert.title}
              </p>
              <span
                className="rounded-full px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider"
                style={{ background: `${alert.accent}1f`, color: alert.accent }}
              >
                live
              </span>
            </div>
            <p className="mt-1 text-[10.5px] leading-4 text-muted-foreground">
              {alert.body}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
