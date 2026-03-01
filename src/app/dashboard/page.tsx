import Link from "next/link";

// --- Static dummy data ---

const weekSummary = {
  sentence:
    "Pretty active week — you met 6 people, most conversations revolved around AI, with some padel and tennis mixed in.",
  stats: [
    { label: "People met", value: "6" },
    { label: "Notes logged", value: "8" },
    { label: "Days active", value: "5" },
  ],
};

const recentTopics = [
  "AI", "Padel", "Career transitions", "Climate tech", "Startups",
  "Book club", "DeepMind", "LBS life", "Dubai", "Solar energy",
];

const coldTopics = [
  { topic: "Family updates", lastDays: 42 },
  { topic: "Fitness goals", lastDays: 35 },
  { topic: "Travel plans", lastDays: 28 },
  { topic: "Mental health", lastDays: 51 },
];

const newContacts = [
  { name: "Ash Scott", summary: "Coffee chat about AI and chess", daysAgo: 1, seed: "Ash Scott" },
  { name: "Kartik Mehta", summary: "Solar energy venture, DeepMind intro", daysAgo: 1, seed: "Kartik Mehta" },
  { name: "Priya Sharma", summary: "Exploring Dubai move and consulting", daysAgo: 3, seed: "Priya Sharma" },
];

const drifts = [
  { name: "Anjali Williams", lastDays: 34, summary: "Going through a career transition" },
  { name: "Omar Ahmed", lastDays: 31, summary: "Back from Tokyo, wants to plan dinner" },
  { name: "Nisha Singh", lastDays: 38, summary: "Thinking about consulting → tech switch" },
  { name: "David Brown", lastDays: 45, summary: "Made a similar career switch last year" },
];

const activities = [
  {
    label: "Padel",
    count: 17,
    desc: "people in your network who play",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: "Movies",
    count: 14,
    desc: "people you could catch a film with",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.2)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
  },
  {
    label: "Coffee chats",
    count: 25,
    desc: "people you regularly grab coffee with",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    label: "AI chats",
    count: 11,
    desc: "people building or exploring AI",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.2)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z" />
        <circle cx="9" cy="13" r="1" fill="currentColor" />
        <circle cx="15" cy="13" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Tennis",
    count: 8,
    desc: "people who play tennis in your network",
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.2)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M4.93 4.93c4.25 4.25 4.25 9.9 0 14.14" />
        <path d="M19.07 4.93c-4.25 4.25-4.25 9.9 0 14.14" />
      </svg>
    ),
  },
];

// --- Sub-components ---

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800/60 rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex items-start sm:items-center justify-between mb-7 gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Sunday, 1 March 2026</p>
        </div>
        <Link
          href="/notes"
          className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="hidden sm:inline">Create new note</span>
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* Week at a Glance */}
          <Card>
            <SectionLabel>Week at a glance</SectionLabel>
            <p className="text-sm text-gray-300 leading-relaxed mb-5">
              {weekSummary.sentence}
            </p>
            <div className="flex gap-4 sm:gap-6 flex-wrap">
              {weekSummary.stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-gray-100">{s.value}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* New Contacts */}
          <Card>
            <SectionLabel>New contacts added</SectionLabel>
            <div className="flex flex-col gap-3">
              {newContacts.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(c.seed)}`}
                    alt={c.name}
                    width={32}
                    height={32}
                    className="rounded-full bg-gray-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{c.summary}</p>
                  </div>
                  <span className="text-[10px] text-gray-600 shrink-0">
                    {c.daysAgo === 1 ? "today" : `${c.daysAgo}d ago`}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Drifts Detected */}
          <Card>
            <SectionLabel>Drifts detected</SectionLabel>
            <div className="flex flex-col gap-3">
              {drifts.map((d) => (
                <div key={d.name} className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{d.name}</p>
                    <p className="text-xs text-gray-500 truncate">{d.summary}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      d.lastDays > 40
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {d.lastDays}d ago
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* Topic Clusters — last 30 days */}
          <Card>
            <SectionLabel>Topic clusters · last 30 days</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {recentTopics.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-400 text-[11px] font-medium border border-violet-500/15"
                >
                  {t}
                </span>
              ))}
            </div>
          </Card>

          {/* Topics gone quiet */}
          <Card>
            <SectionLabel>Gone quiet</SectionLabel>
            <div className="flex flex-col gap-2.5">
              {coldTopics.map((t) => (
                <div key={t.topic} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{t.topic}</span>
                  <span className="text-[10px] text-gray-600">{t.lastDays}d ago</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Suggested Activities */}
          <Card>
            <SectionLabel>Suggested activities</SectionLabel>
            <div className="flex flex-col gap-2">
              {activities.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors"
                  style={{ backgroundColor: a.bg, borderColor: a.border }}
                >
                  <span style={{ color: a.color }}>{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{a.label}</p>
                    <p className="text-[10px] text-gray-500 leading-tight">{a.count} {a.desc}</p>
                  </div>
                  <span
                    className="text-xs font-bold shrink-0"
                    style={{ color: a.color }}
                  >
                    {a.count}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
