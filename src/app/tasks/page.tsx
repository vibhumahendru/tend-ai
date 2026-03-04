"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authedFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

// --- Types ---

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  urgency: "low" | "neutral" | "high";
  category: "work" | "admin" | "personal" | "ideas";
  status: "pending" | "complete";
  created_at: string;
}

type Category = "all" | "work" | "admin" | "personal" | "ideas";
type SortMode = "newest" | "urgency";

// --- Style maps ---

const urgencyStyles: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  neutral: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

const categoryStyles: Record<string, string> = {
  work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  admin: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  personal: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ideas: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

const urgencyOrder: Record<string, number> = { high: 0, neutral: 1, low: 2 };

const categoryIcons: Record<string, string> = {
  all: "◈",
  work: "💼",
  admin: "📋",
  personal: "👤",
  ideas: "💡",
};

// --- Component ---

export default function TasksPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeTab, setActiveTab] = useState<"pending" | "complete">("pending");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  useEffect(() => {
    if (!session) return;
    const fetchTasks = async () => {
      try {
        const res = await authedFetch(`${API_BASE}/tend/tasks/`, {}, session.access_token);
        if (res.ok) {
          const data = await res.json();
          setTasks(data.tasks ?? []);
        }
      } catch {
        // Handle silently
      } finally {
        setIsFetching(false);
      }
    };
    fetchTasks();
  }, [session]);

  if (loading || !session) return null;

  // Pending counts per category (for sidebar labels)
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const pendingCount = (cat: Category) =>
    cat === "all" ? pendingTasks.length : pendingTasks.filter((t) => t.category === cat).length;

  // Filtered + sorted tasks for main list
  const filtered = tasks
    .filter((t) => t.status === activeTab)
    .filter((t) => activeCategory === "all" || t.category === activeCategory)
    .sort((a, b) => {
      if (sortMode === "urgency") return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "pending" ? "complete" : "pending";
    // Optimistic update
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await authedFetch(
        `${API_BASE}/tend/tasks/${task.id}/`,
        { method: "PATCH", body: JSON.stringify({ status: newStatus }) },
        session.access_token
      );
    } catch {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t)));
    }
  };

  const categories: Category[] = ["all", "work", "admin", "personal", "ideas"];

  const sidebar = (
    <nav className="flex flex-col gap-0.5">
      {categories.map((cat) => {
        const count = pendingCount(cat);
        return (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
              activeCategory === cat
                ? "bg-violet-500/15 text-violet-400"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
            }`}
          >
            <span className="text-base leading-none">{categoryIcons[cat]}</span>
            <span className="flex-1 capitalize">{cat === "all" ? "All Tasks" : cat}</span>
            {count > 0 && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                activeCategory === cat ? "bg-violet-500/25 text-violet-300" : "bg-gray-800 text-gray-500"
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Desktop category sidebar */}
      <aside className="hidden md:flex flex-col w-48 shrink-0 py-6 pr-4 border-r border-gray-800/50">
        <h2 className="text-xs text-gray-600 uppercase tracking-wider font-semibold px-3 mb-3">Categories</h2>
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-4 border-b border-gray-800/50">
          {/* Mobile category dropdown */}
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as Category)}
            className="md:hidden bg-gray-900 border border-gray-700/50 text-gray-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500/50"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Tasks" : cat.charAt(0).toUpperCase() + cat.slice(1)} {pendingCount(cat) > 0 ? `(${pendingCount(cat)})` : ""}
              </option>
            ))}
          </select>

          {/* Pending / Completed tabs */}
          <div className="flex bg-gray-900 border border-gray-800/60 rounded-lg p-0.5 gap-0.5">
            {(["pending", "complete"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
                  activeTab === tab ? "bg-gray-800 text-gray-100" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab === "complete" ? "Completed" : "Pending"}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* New Task CTA */}
          <button
            onClick={() => router.push("/notes")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Task
          </button>

          {/* Sort toggle */}
          <button
            onClick={() => setSortMode((s) => (s === "newest" ? "urgency" : "newest"))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-300 border border-gray-800/60 hover:border-gray-700/60 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M7 12h10M11 18h2" />
            </svg>
            {sortMode === "newest" ? "Newest" : "Urgency"}
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
          {isFetching ? (
            <div className="flex items-center justify-center h-32">
              <span className="w-5 h-5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <p className="text-gray-500 text-sm">
                {activeTab === "pending"
                  ? "No pending tasks here. Add some from the Notes page!"
                  : "No completed tasks yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-gray-800/40 border border-gray-800/50 rounded-xl overflow-hidden">
              {filtered.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 px-4 py-4 bg-gray-900 hover:bg-gray-900/80 transition-colors ${
                    task.status === "complete" ? "opacity-50" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.status === "complete"}
                    onChange={() => toggleStatus(task)}
                    className="mt-0.5 w-4 h-4 accent-violet-500 cursor-pointer shrink-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${task.status === "complete" ? "line-through text-gray-500" : "text-gray-200"}`}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-[11px] text-gray-600 mt-0.5">{task.due_date}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${urgencyStyles[task.urgency]}`}>
                      {task.urgency.toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryStyles[task.category]}`}>
                      {task.category.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
