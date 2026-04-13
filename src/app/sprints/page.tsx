"use client";

import { Suspense, useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { API_BASE, authedFetch } from "@/lib/api";
import type { Sprint, SprintListItem, Goal } from "@/lib/sprint-types";
import { sprintStatusStyles } from "@/lib/sprint-types";

export default function SprintsPage() {
  return (
    <Suspense>
      <SprintsContent />
    </Suspense>
  );
}

// ---------------------------------------------------------------------------
// Category colors + emoji mapping
// ---------------------------------------------------------------------------

const GOAL_CATEGORIES = ["Health", "Work", "Growth", "Social", "Finance", ""];

const CATEGORY_EMOJI: Record<string, string> = {
  Health: "💪",
  Work: "💼",
  Growth: "📖",
  Social: "👥",
  Finance: "💰",
  "": "⭐",
};

const CATEGORY_CHECK_COLOR: Record<string, string> = {
  Health: "bg-emerald-500",
  Work: "bg-sky-500",
  Growth: "bg-teal-500",
  Social: "bg-pink-400",
  Finance: "bg-amber-500",
  "": "bg-violet-500",
};

const CATEGORY_BADGE: Record<string, string> = {
  Health: "bg-emerald-500/10 text-emerald-400",
  Work: "bg-sky-500/10 text-sky-400",
  Growth: "bg-teal-500/10 text-teal-400",
  Social: "bg-pink-500/10 text-pink-400",
  Finance: "bg-amber-500/10 text-amber-400",
  "": "bg-gray-500/10 text-gray-400",
};

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function SprintsContent() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const [sprints, setSprints] = useState<SprintListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [isFetchingList, setIsFetchingList] = useState(true);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  const [showNewSprint, setShowNewSprint] = useState(false);
  const [newSprintDate, setNewSprintDate] = useState("");

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", description: "", target_count: 1, category: "" });

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState({ name: "", description: "", target_count: 1, category: "" });

  const [reflection, setReflection] = useState("");

  const token = session?.access_token ?? "";

  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  const fetchSprints = useCallback(async () => {
    if (!token) return;
    setIsFetchingList(true);
    try {
      const res = await authedFetch(`${API_BASE}/tend/sprints/`, {}, token);
      const data = await res.json();
      setSprints(data.sprints ?? []);
    } catch { /* ignore */ } finally { setIsFetchingList(false); }
  }, [token]);

  useEffect(() => { fetchSprints(); }, [fetchSprints]);

  useEffect(() => {
    if (sprints.length > 0 && !selectedId) setSelectedId(sprints[0].id);
  }, [sprints, selectedId]);

  const fetchDetail = useCallback(async () => {
    if (!token || !selectedId) return;
    setIsFetchingDetail(true);
    try {
      const res = await authedFetch(`${API_BASE}/tend/sprints/${selectedId}/`, {}, token);
      const data = await res.json();
      setSprint(data);
      setReflection(data.reflection ?? "");
    } catch { /* ignore */ } finally { setIsFetchingDetail(false); }
  }, [token, selectedId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function formatDateRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
  }

  function formatDateRangeFull(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString("en-GB", { month: "long", day: "numeric" })} – ${e.toLocaleDateString("en-GB", { month: "long", day: "numeric", year: "numeric" })}`;
  }

  function daysRemaining(end: string) {
    return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000));
  }

  function pacingPercent(goals: Goal[]) {
    const totalTarget = goals.reduce((s, g) => s + g.target_count, 0);
    const totalCurrent = goals.reduce((s, g) => s + g.current_count, 0);
    if (totalTarget === 0) return 100;
    return Math.round((totalCurrent / totalTarget) * 100);
  }

  function toMondayStart(dateStr: string) {
    return new Date(dateStr + "T08:00:00+01:00").toISOString();
  }

  function toSundayEnd(dateStr: string) {
    const d = new Date(dateStr + "T08:00:00+01:00");
    d.setDate(d.getDate() + 6);
    d.setHours(20, 0, 0, 0);
    return d.toISOString();
  }

  function sprintLabel(s: SprintListItem, idx: number) {
    return `Sprint ${sprints.length - idx}`;
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function createSprint() {
    if (!newSprintDate || !token) return;
    try {
      const res = await authedFetch(`${API_BASE}/tend/sprints/`, {
        method: "POST",
        body: JSON.stringify({ week_start: toMondayStart(newSprintDate), week_end: toSundayEnd(newSprintDate), status: "planning" }),
      }, token);
      const data = await res.json();
      setShowNewSprint(false);
      setNewSprintDate("");
      await fetchSprints();
      setSelectedId(data.id);
    } catch { /* ignore */ }
  }

  async function updateSprintStatus(newStatus: string) {
    if (!sprint || !token) return;
    const res = await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) }, token);
    setSprint(await res.json());
    fetchSprints();
  }

  async function saveReflection() {
    if (!sprint || !token) return;
    const res = await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/`, { method: "PATCH", body: JSON.stringify({ reflection }) }, token);
    setSprint(await res.json());
  }

  async function deleteSprint() {
    if (!sprint || !token) return;
    await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/`, { method: "DELETE" }, token);
    setSelectedId(null);
    setSprint(null);
    fetchSprints();
  }

  async function addGoal() {
    if (!sprint || !token || !newGoal.name.trim()) return;
    await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/goals/`, { method: "POST", body: JSON.stringify(newGoal) }, token);
    setNewGoal({ name: "", description: "", target_count: 1, category: "" });
    setShowNewGoal(false);
    fetchDetail();
  }

  async function setGoalCount(goalId: string, count: number) {
    if (!sprint || !token) return;
    await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/goals/${goalId}/`, { method: "PATCH", body: JSON.stringify({ current_count: count }) }, token);
    fetchDetail();
  }

  async function deleteGoal(goalId: string) {
    if (!sprint || !token) return;
    await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/goals/${goalId}/`, { method: "DELETE" }, token);
    fetchDetail();
  }

  async function saveGoalEdit(goalId: string) {
    if (!sprint || !token) return;
    await authedFetch(`${API_BASE}/tend/sprints/${sprint.id}/goals/${goalId}/`, { method: "PATCH", body: JSON.stringify(editGoal) }, token);
    setEditingGoalId(null);
    fetchDetail();
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>;
  if (!session) return null;

  const goals = sprint?.goals ?? [];
  const sprintIdx = sprints.findIndex((s) => s.id === selectedId);

  return (
    <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] gap-0">
      {/* LEFT PANEL — Sprint list */}
      <div className="w-56 shrink-0 flex flex-col border-r border-gray-800/50 pr-3">
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-base font-semibold text-gray-100">Sprints</h2>
          <button
            onClick={() => setShowNewSprint(true)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 transition-colors"
          >
            + New
          </button>
        </div>

        {showNewSprint && (
          <div className="mb-4 p-3 rounded-xl bg-gray-900 border border-gray-800/60 mx-1">
            <label className="text-[11px] text-gray-500 block mb-1">Start date (Monday)</label>
            <input
              type="date"
              value={newSprintDate}
              onChange={(e) => setNewSprintDate(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-sm text-gray-100 mb-2"
            />
            <div className="flex gap-2">
              <button onClick={createSprint} disabled={!newSprintDate} className="flex-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors">Create</button>
              <button onClick={() => { setShowNewSprint(false); setNewSprintDate(""); }} className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-0.5 px-1">
          {isFetchingList && sprints.length === 0 ? (
            <div className="text-sm text-gray-600 py-8 text-center">Loading…</div>
          ) : sprints.length === 0 ? (
            <div className="text-sm text-gray-600 py-8 text-center">No sprints yet</div>
          ) : (
            sprints.map((s, idx) => {
              const isSelected = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                    isSelected
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="font-semibold text-[13px]">{sprintLabel(s, idx)}</div>
                  <div className="text-[11px] mt-0.5 opacity-60">{formatDateRange(s.week_start, s.week_end)}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${sprintStatusStyles[s.status]}`}>
                      {s.status}
                    </span>
                    <span className="text-[10px] opacity-50">{s.goal_count} goals</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL — Sprint detail (centered like the HTML inspo) */}
      <div className="flex-1 overflow-y-auto">
        {isFetchingDetail && !sprint ? (
          <div className="flex items-center justify-center h-full text-gray-500">Loading sprint…</div>
        ) : !sprint ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <div className="text-5xl mb-4 opacity-30">🎯</div>
            <p className="text-sm">Select a sprint or create a new one</p>
          </div>
        ) : (
          <div className="max-w-xl mx-auto px-4 py-6">
            {/* Sprint header — centered, large */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold text-gray-50 tracking-tight">
                Pride Tracker
              </h1>
              <p className="text-sm text-gray-500 mt-1">What would make you proud this week?</p>
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-gray-800/60 border border-gray-700/50">
                <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                  {sprintIdx >= 0 ? `Sprint ${sprints.length - sprintIdx}` : "Sprint"} · {formatDateRange(sprint.week_start, sprint.week_end).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-center gap-3 mt-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sprintStatusStyles[sprint.status]}`}>
                  {sprint.status}
                </span>
                {sprint.status === "active" && (
                  <span className="text-xs text-gray-500">
                    {daysRemaining(sprint.week_end)} days left · {pacingPercent(goals)}%
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {sprint.status === "planning" && (
                  <button onClick={() => updateSprintStatus("active")} className="px-4 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 transition-colors">
                    Start Sprint
                  </button>
                )}
                {sprint.status === "active" && (
                  <button onClick={() => updateSprintStatus("completed")} className="px-4 py-1.5 text-xs font-semibold rounded-full bg-gray-600/20 text-gray-400 hover:bg-gray-600/30 border border-gray-600/30 transition-colors">
                    Complete Sprint
                  </button>
                )}
                <button onClick={() => setShowNewGoal(true)} className="px-4 py-1.5 text-xs font-semibold rounded-full bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/20 transition-colors">
                  + Add Goal
                </button>
                <button onClick={deleteSprint} className="px-3 py-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors" title="Delete sprint">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                </button>
              </div>
            </div>

            {/* New goal form */}
            {showNewGoal && (
              <div className="mb-6 p-5 rounded-2xl bg-gray-900/80 border border-gray-800/60">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="text-[11px] text-gray-500 mb-1 block font-medium">Goal name</label>
                    <input value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })} placeholder="e.g. Gym sessions" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[11px] text-gray-500 mb-1 block font-medium">Description</label>
                    <input value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="Why this matters" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block font-medium">Target count</label>
                    <input type="number" min={1} value={newGoal.target_count} onChange={(e) => setNewGoal({ ...newGoal, target_count: Math.max(1, parseInt(e.target.value) || 1) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-500 mb-1 block font-medium">Category</label>
                    <select value={newGoal.category} onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100">
                      <option value="">None</option>
                      {GOAL_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button onClick={addGoal} disabled={!newGoal.name.trim()} className="px-5 py-2 text-xs font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 transition-colors">Add Goal</button>
                  <button onClick={() => { setShowNewGoal(false); setNewGoal({ name: "", description: "", target_count: 1, category: "" }); }} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                </div>
              </div>
            )}

            {/* Goal cards */}
            {goals.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <div className="text-4xl mb-3 opacity-40">🎯</div>
                <p className="text-sm">No goals yet. Add some to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  editingGoalId === goal.id ? (
                    <EditGoalCard
                      key={goal.id}
                      editGoal={editGoal}
                      onEditChange={setEditGoal}
                      onSave={() => saveGoalEdit(goal.id)}
                      onCancel={() => setEditingGoalId(null)}
                    />
                  ) : (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      sprintStatus={sprint.status}
                      onStartEdit={() => {
                        setEditingGoalId(goal.id);
                        setEditGoal({ name: goal.name, description: goal.description, target_count: goal.target_count, category: goal.category });
                      }}
                      onSetCount={(count) => setGoalCount(goal.id, count)}
                      onDelete={() => deleteGoal(goal.id)}
                    />
                  )
                ))}
              </div>
            )}

            {/* Reflection */}
            {sprint.status === "completed" && (
              <div className="mt-10 text-center">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Reflection</h2>
                <textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="How do you feel about this week? What are you proud of?"
                  rows={4}
                  className="w-full bg-gray-900/80 border border-gray-800/60 rounded-2xl px-5 py-4 text-sm text-gray-100 placeholder-gray-600 resize-none"
                />
                <button onClick={saveReflection} className="mt-3 px-5 py-2 text-xs font-semibold rounded-full bg-violet-600 text-white hover:bg-violet-500 transition-colors">
                  Save Reflection
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="text-center mt-12 text-[11px] text-gray-700 italic">
              a stack of good weeks makes a good life
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goal card — inspired by fiancee-pride-tracker.html
// ---------------------------------------------------------------------------

function GoalCard({
  goal,
  sprintStatus,
  onStartEdit,
  onSetCount,
  onDelete,
}: {
  goal: Goal;
  sprintStatus: string;
  onStartEdit: () => void;
  onSetCount: (count: number) => void;
  onDelete: () => void;
}) {
  const emoji = CATEGORY_EMOJI[goal.category] ?? CATEGORY_EMOJI[""];
  const checkColor = CATEGORY_CHECK_COLOR[goal.category] ?? CATEGORY_CHECK_COLOR[""];
  const badgeStyle = CATEGORY_BADGE[goal.category] ?? CATEGORY_BADGE[""];
  const isComplete = goal.current_count >= goal.target_count;
  const isClickable = sprintStatus === "active";
  const [justChecked, setJustChecked] = useState<number | null>(null);

  return (
    <div className={`group rounded-2xl border p-5 transition-all ${isComplete ? "border-emerald-500/40 bg-emerald-500/5" : "border-gray-800/60 bg-gray-900/60 hover:border-gray-700/60"}`}>
      {/* Top row: emoji + name + badge + actions */}
      <div className="flex items-center gap-3 mb-1.5">
        <div className="text-2xl w-9 h-9 flex items-center justify-center rounded-xl shrink-0">
          {emoji}
        </div>
        <h3 className="text-base font-bold text-gray-100 flex-1">{goal.name}</h3>
        {goal.category && (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeStyle}`}>
            {goal.category}
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity">
          <button onClick={onStartEdit} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
          <button onClick={onDelete} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-[13px] text-gray-500 mb-3 pl-12 leading-relaxed">{goal.description}</p>
      )}

      {/* Checkboxes — square, colored, with pop animation */}
      <div className="flex items-center gap-2 pl-12 flex-wrap">
        {Array.from({ length: goal.target_count }).map((_, i) => {
          const isFilled = i < goal.current_count;
          const isPopping = justChecked === i;
          return (
            <button
              key={i}
              disabled={!isClickable}
              onClick={() => {
                const newCount = isFilled ? i : i + 1;
                if (!isFilled) {
                  setJustChecked(i);
                  setTimeout(() => setJustChecked(null), 350);
                }
                onSetCount(newCount);
              }}
              className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-base font-bold transition-all ${
                isFilled
                  ? `${checkColor} border-transparent text-white`
                  : "bg-gray-800/60 border-gray-700/80 text-transparent hover:border-gray-600"
              } ${isClickable ? "cursor-pointer" : "cursor-default"} ${isPopping ? "animate-[pop_0.3s_ease-out]" : ""}`}
            >
              {isFilled ? "✓" : ""}
            </button>
          );
        })}
      </div>

      {/* Progress text */}
      <div className="pl-12 mt-2.5">
        <span className={`text-xs font-semibold ${isComplete ? "text-emerald-400" : "text-gray-500"}`}>
          {goal.current_count}/{goal.target_count}{isComplete ? " — Done! ✨" : ""}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit goal card
// ---------------------------------------------------------------------------

function EditGoalCard({
  editGoal,
  onEditChange,
  onSave,
  onCancel,
}: {
  editGoal: { name: string; description: string; target_count: number; category: string };
  onEditChange: (val: typeof editGoal) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="p-5 rounded-2xl bg-gray-900/80 border border-violet-500/30">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="text-[11px] text-gray-500 mb-1 block font-medium">Name</label>
          <input value={editGoal.name} onChange={(e) => onEditChange({ ...editGoal, name: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100" />
        </div>
        <div className="col-span-2">
          <label className="text-[11px] text-gray-500 mb-1 block font-medium">Description</label>
          <input value={editGoal.description} onChange={(e) => onEditChange({ ...editGoal, description: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100" />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block font-medium">Target</label>
          <input type="number" min={1} value={editGoal.target_count} onChange={(e) => onEditChange({ ...editGoal, target_count: Math.max(1, parseInt(e.target.value) || 1) })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100" />
        </div>
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block font-medium">Category</label>
          <select value={editGoal.category} onChange={(e) => onEditChange({ ...editGoal, category: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-100">
            <option value="">None</option>
            {GOAL_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onSave} className="px-5 py-2 text-xs font-semibold rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-colors">Save</button>
        <button onClick={onCancel} className="px-3 py-2 text-xs text-gray-500 hover:text-gray-300">Cancel</button>
      </div>
    </div>
  );
}
