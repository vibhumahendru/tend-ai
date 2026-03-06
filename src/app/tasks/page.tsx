"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
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

// --- Icons ---

function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

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

  // Voice editing state — single set, shared across all tasks
  const [recordingTaskId, setRecordingTaskId] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string>("");
  const [highlightedTask, setHighlightedTask] = useState<{ id: string; fields: string[] } | null>(null);

  // Recording refs — single set, reused per task
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

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

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      mediaRecorderRef.current?.stop();
    };
  }, []);

  if (loading || !session) return null;

  // --- Waveform ---

  const drawWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#a78bfa";
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    draw();
  };

  // --- Voice record handler ---

  const handleVoiceRecord = async (taskId: string) => {
    // If already recording THIS task, stop it
    if (recordingTaskId === taskId) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      mediaRecorderRef.current?.stop();
      setRecordingTaskId(null);
      return;
    }

    // If recording a DIFFERENT task, stop that first
    if (recordingTaskId) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      mediaRecorderRef.current?.stop();
      setRecordingTaskId(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = audioCtx;

      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
        MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" :
        MediaRecorder.isTypeSupported("audio/aac") ? "audio/aac" : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const resolvedMime = recorder.mimeType || mimeType;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const isMp4 = resolvedMime.includes("mp4") || resolvedMime.includes("aac") || resolvedMime.includes("m4a");
        const ext = isMp4 ? "mp4" : "webm";
        const blob = new Blob(audioChunksRef.current, { type: resolvedMime || "audio/webm" });
        if (blob.size < 1000) return;

        const formData = new FormData();
        formData.append("audio", blob, `recording.${ext}`);

        // Step 1: Transcribe
        setProcessingTaskId(taskId);
        setProcessingLabel("Transcribing\u2026");
        try {
          const transcribeRes = await authedFormFetch(
            `${API_BASE}/tend/transcribe/`,
            formData,
            session!.access_token
          );
          if (!transcribeRes.ok) { setProcessingTaskId(null); return; }
          const { text } = await transcribeRes.json();
          if (!text?.trim()) { setProcessingTaskId(null); return; }

          // Step 2: Voice update
          setProcessingLabel("Updating\u2026");
          const updateRes = await authedFetch(
            `${API_BASE}/tend/tasks/${taskId}/voice-update/`,
            { method: "POST", body: JSON.stringify({ voice_text: text }) },
            session!.access_token
          );
          if (!updateRes.ok) { setProcessingTaskId(null); return; }
          const result = await updateRes.json();

          if (result.action === "delete") {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
          } else if (result.action === "update") {
            setTasks((prev) => prev.map((t) => (t.id === taskId ? result.task : t)));
            setHighlightedTask({ id: taskId, fields: result.changed_fields ?? [] });
            setTimeout(() => setHighlightedTask(null), 2000);
          }
        } catch {
          // Silently fail
        } finally {
          setProcessingTaskId(null);
          setProcessingLabel("");
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecordingTaskId(taskId);
      setTimeout(drawWaveform, 50);
    } catch {
      // Microphone permission denied
    }
  };

  // --- Derived data ---

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const pendingCount = (cat: Category) =>
    cat === "all" ? pendingTasks.length : pendingTasks.filter((t) => t.category === cat).length;

  const filtered = tasks
    .filter((t) => t.status === activeTab)
    .filter((t) => activeCategory === "all" || t.category === activeCategory)
    .sort((a, b) => {
      if (sortMode === "urgency") return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "pending" ? "complete" : "pending";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    try {
      await authedFetch(
        `${API_BASE}/tend/tasks/${task.id}/`,
        { method: "PATCH", body: JSON.stringify({ status: newStatus }) },
        session.access_token
      );
    } catch {
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
              {filtered.map((task) => {
                const isRecordingThis = recordingTaskId === task.id;
                const isProcessingThis = processingTaskId === task.id;
                const isHighlighted = highlightedTask?.id === task.id;
                const highlightFields = highlightedTask?.id === task.id ? highlightedTask.fields : [];
                const isBusy = isRecordingThis || isProcessingThis;

                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 px-4 py-4 bg-gray-900 hover:bg-gray-900/80 transition-all duration-500 ${
                      task.status === "complete" ? "opacity-50" : ""
                    } ${isHighlighted ? "ring-1 ring-violet-500/40 bg-violet-500/5" : ""}`}
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
                      <p className={`text-sm leading-snug transition-colors duration-500 ${
                        task.status === "complete" ? "line-through text-gray-500" : "text-gray-200"
                      } ${highlightFields.includes("title") ? "text-violet-300" : ""}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className={`text-[11px] mt-0.5 transition-colors duration-500 ${
                          highlightFields.includes("due_date") ? "text-violet-400" : "text-gray-600"
                        }`}>
                          {task.due_date}
                        </p>
                      )}

                      {/* Waveform — inline, below title */}
                      {isRecordingThis && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-red-400 font-medium">Recording…</span>
                            <span className="text-xs text-gray-600 ml-auto">Tap mic to stop</span>
                          </div>
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={36}
                            className="w-full h-9 rounded-lg bg-gray-800/40"
                          />
                        </div>
                      )}

                      {/* Processing state */}
                      {isProcessingThis && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                          <span className="text-xs text-violet-400 font-medium">{processingLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Badges + mic */}
                    <div className="flex gap-1.5 shrink-0 flex-wrap justify-end items-center">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all duration-500 ${
                        urgencyStyles[task.urgency]
                      } ${highlightFields.includes("urgency") ? "ring-1 ring-violet-400/60" : ""}`}>
                        {task.urgency.toUpperCase()}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all duration-500 ${
                        categoryStyles[task.category]
                      } ${highlightFields.includes("category") ? "ring-1 ring-violet-400/60" : ""}`}>
                        {task.category.toUpperCase()}
                      </span>

                      {/* Mic button */}
                      <button
                        onClick={() => handleVoiceRecord(task.id)}
                        disabled={
                          (recordingTaskId !== null && recordingTaskId !== task.id) ||
                          isProcessingThis ||
                          (processingTaskId !== null && processingTaskId !== task.id)
                        }
                        title={isRecordingThis ? "Stop recording" : "Voice edit"}
                        className={`p-1.5 rounded-lg transition-colors ml-0.5 disabled:opacity-30 ${
                          isRecordingThis
                            ? "bg-red-500/15 text-red-400 border border-red-500/30"
                            : isBusy
                            ? "text-gray-600"
                            : "text-gray-600 hover:text-violet-400 hover:bg-violet-500/10"
                        }`}
                      >
                        <MicIcon size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
