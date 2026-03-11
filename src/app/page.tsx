import Link from "next/link";

// --- Inline SVG icons for features ---

function MicIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function TimerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M5 3L2 6" /><path d="M22 6l-3-3" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
      <path d="M9.5 2a3.5 3.5 0 0 0-3.4 4.35A3.5 3.5 0 0 0 5 13a3.5 3.5 0 0 0 2.8 6.5A3.5 3.5 0 0 0 12 22" />
      <path d="M14.5 2a3.5 3.5 0 0 1 3.4 4.35A3.5 3.5 0 0 1 19 13a3.5 3.5 0 0 1-2.8 6.5A3.5 3.5 0 0 1 12 22" />
      <path d="M12 2v20" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckListIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

// --- Step number circle ---
function StepNumber({ n }: { n: number }) {
  return (
    <div className="w-12 h-12 rounded-full bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-violet-400 text-lg font-semibold shrink-0">
      {n}
    </div>
  );
}

// --- Main page ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ========== NAVBAR ========== */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-gray-800/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Tend <span className="text-violet-400">AI</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-400 hover:text-gray-100 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 md:pt-36 md:pb-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Remember everyone.
          <br />
          <span className="text-violet-400">Finish everything.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The AI-powered personal CRM and task manager that helps you nurture
          your relationships and get things done — so nothing and no one falls
          through the cracks.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-600/20"
        >
          Get Started
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Hero screenshot placeholder */}
        <div className="mt-16 md:mt-20 relative">
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden aspect-[16/10] flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/60 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 font-medium">App screenshot</p>
              <p className="text-xs text-gray-700 mt-1">1200 x 750 recommended</p>
            </div>
          </div>
          {/* Subtle glow behind the screenshot */}
          <div className="absolute -inset-4 -z-10 bg-violet-600/5 rounded-3xl blur-3xl" />
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything you need to stay on top
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-gray-700/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <MicIcon />
            </div>
            <h3 className="text-base font-semibold mb-2">Ramble to Create</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Just talk or type naturally. AI parses your stream of consciousness
              into structured tasks — no forms, no friction.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-gray-700/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <TimerIcon />
            </div>
            <h3 className="text-base font-semibold mb-2">Focus Mode</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Start a timer and everything else disappears. Just you, the task,
              and a countdown — nothing else on screen.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-gray-700/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <BrainIcon />
            </div>
            <h3 className="text-base font-semibold mb-2">AI Task Planning</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Ramble about what you need to do. AI breaks it into clear,
              checkable steps you can tick off as you go.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-gray-700/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <PeopleIcon />
            </div>
            <h3 className="text-base font-semibold mb-2">Relationship Memory</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Save notes about the people in your life. Birthdays, preferences,
              conversations — never forget a detail again.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-gray-700/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
              <SearchIcon />
            </div>
            <h3 className="text-base font-semibold mb-2">Search Everything</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Instantly query across all your notes, people, and tasks.
              Find anything with natural language — fast.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl p-6 hover:border-gray-700/60 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <CheckListIcon />
            </div>
            <h3 className="text-base font-semibold mb-2">Smart Task Manager</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Urgency levels, focus flags, categories, and sorting — your tasks
              are organized the way your brain works.
            </p>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Three steps. Zero friction.
          </h2>
        </div>

        <div className="flex flex-col gap-12">
          {/* Step 1 */}
          <div className="flex items-start gap-6">
            <StepNumber n={1} />
            <div className="pt-1">
              <h3 className="text-lg font-semibold mb-1">Capture</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                Ramble your thoughts — voice or text. Talk about tasks you need to do,
                notes about people, or anything on your mind. No structure needed.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-6">
            <StepNumber n={2} />
            <div className="pt-1">
              <h3 className="text-lg font-semibold mb-1">Organize</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                AI understands your intent, classifies it, and structures everything
                automatically — tasks with urgency levels, notes linked to the right
                people, and plans broken into steps.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-6">
            <StepNumber n={3} />
            <div className="pt-1">
              <h3 className="text-lg font-semibold mb-1">Focus</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-lg">
                Hit Start on any task. The world fades away — just a timer, your task
                title, and the steps to complete. Check them off one by one. When you
                are done, confetti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SCREENSHOTS / FEATURE HIGHLIGHTS ========== */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Screenshot placeholder 1 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-800/60 flex items-center justify-center mx-auto mb-3">
                <TimerIcon />
              </div>
              <p className="text-sm text-gray-500 font-medium">Focus Mode</p>
              <p className="text-xs text-gray-700 mt-1">Screenshot placeholder</p>
            </div>
          </div>

          {/* Screenshot placeholder 2 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-800/60 flex items-center justify-center mx-auto mb-3">
                <MicIcon />
              </div>
              <p className="text-sm text-gray-500 font-medium">Task Creation</p>
              <p className="text-xs text-gray-700 mt-1">Screenshot placeholder</p>
            </div>
          </div>

          {/* Screenshot placeholder 3 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-800/60 flex items-center justify-center mx-auto mb-3">
                <PeopleIcon />
              </div>
              <p className="text-sm text-gray-500 font-medium">Relationship Memory</p>
              <p className="text-xs text-gray-700 mt-1">Screenshot placeholder</p>
            </div>
          </div>

          {/* Screenshot placeholder 4 */}
          <div className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-800/60 flex items-center justify-center mx-auto mb-3">
                <SearchIcon />
              </div>
              <p className="text-sm text-gray-500 font-medium">AI Search</p>
              <p className="text-xs text-gray-700 mt-1">Screenshot placeholder</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-28 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Ready to tend to what matters?
        </h2>
        <p className="text-gray-400 mb-10 text-lg">
          Start remembering everyone and finishing everything.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-600/20"
        >
          Get Started — it&apos;s free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-gray-800/40 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Tend AI
          </p>
          <p className="text-xs text-gray-700">
            Built with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
