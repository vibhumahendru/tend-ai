"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { formatDueDate, getDueDateStatus } from "@/lib/dates";

// --- Types ---

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  urgency: "low" | "neutral" | "high";
  category: "work" | "admin" | "personal" | "ideas";
  status: "pending" | "complete";
  is_focused: boolean;
  created_at: string;
}

type Category = "all" | "work" | "admin" | "personal" | "ideas";

interface ParsedTask {
  title: string;
  description: string;
  due_date: string | null;
  urgency: "low" | "neutral" | "high";
  category: "work" | "admin" | "personal" | "ideas";
}

interface SavedTask extends ParsedTask { id: string; }

type DrawerMessage =
  | { role: "user"; text: string }
  | { role: "tasks"; tasks: SavedTask[] }
  | { role: "info"; text: string };

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

function SendIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  );
}

// --- Component ---

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  );
}

function TasksContent() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [activeTab, setActiveTab] = useState<"pending" | "complete">("pending");
  const [sortBy, setSortBy] = useState<"created" | "urgency" | "due">("created");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Voice editing state — single set, shared across all tasks
  const [recordingTaskId, setRecordingTaskId] = useState<string | null>(null);
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [processingLabel, setProcessingLabel] = useState<string>("");
  const [highlightedTask, setHighlightedTask] = useState<{ id: string; fields: string[] } | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInput, setDrawerInput] = useState("");
  const [drawerMessages, setDrawerMessages] = useState<DrawerMessage[]>([]);
  const [drawerProcessing, setDrawerProcessing] = useState(false);
  const [drawerRecording, setDrawerRecording] = useState(false);
  const [drawerTranscribing, setDrawerTranscribing] = useState(false);

  // Handle ?highlight=<taskId> from notes page navigation
  useEffect(() => {
    const highlightId = searchParams.get("highlight");
    if (highlightId && !isFetching) {
      setExpandedTaskId(highlightId);
      setHighlightedTask({ id: highlightId, fields: [] });
      setTimeout(() => setHighlightedTask(null), 3000);
      // Clean URL without re-render
      window.history.replaceState(null, "", "/tasks");
    }
  }, [searchParams, isFetching]);

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drawer recording refs (separate from task-editing voice refs)
  const drawerMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const drawerAudioChunksRef = useRef<Blob[]>([]);
  const drawerAnalyserRef = useRef<AnalyserNode | null>(null);
  const drawerAudioCtxRef = useRef<AudioContext | null>(null);
  const drawerAnimFrameRef = useRef<number | null>(null);
  const drawerCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawerScrollRef = useRef<HTMLDivElement>(null);

  const fetchTasks = async () => {
    if (!session) return;
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

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      mediaRecorderRef.current?.stop();
      if (drawerAnimFrameRef.current) cancelAnimationFrame(drawerAnimFrameRef.current);
      drawerAudioCtxRef.current?.close();
      drawerMediaRecorderRef.current?.stop();
    };
  }, []);

  // Auto-scroll drawer messages
  useEffect(() => {
    if (drawerScrollRef.current) {
      requestAnimationFrame(() => {
        if (drawerScrollRef.current) {
          drawerScrollRef.current.scrollTop = drawerScrollRef.current.scrollHeight;
        }
      });
    }
  }, [drawerMessages, drawerProcessing]);

  if (loading || !session) return null;

  // --- Mini waveform: draws 5 real-voice bars onto a tiny canvas ---

  const drawMiniWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const bars = 5;
    const barW = 2;
    const gap = 1;
    const totalW = bars * barW + (bars - 1) * gap; // 14
    const h = canvas.height; // 14

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);

      ctx.clearRect(0, 0, canvas.width, h);

      // Sample 5 frequency bands spread across the low-mid range
      const step = Math.floor(freqData.length / (bars + 1));
      for (let i = 0; i < bars; i++) {
        const val = freqData[step * (i + 1)] / 255; // 0-1
        const barH = Math.max(2, val * h);
        const x = i * (barW + gap) + (canvas.width - totalW) / 2;
        const y = (h - barH) / 2;

        ctx.fillStyle = "#f87171"; // red-400
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 1);
        ctx.fill();
      }
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
      analyser.fftSize = 64;
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

        setProcessingTaskId(taskId);
        setProcessingLabel("Updating\u2026");
        try {
          const updateRes = await authedFormFetch(
            `${API_BASE}/tend/tasks/${taskId}/voice-update-direct/`,
            formData,
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
      setTimeout(drawMiniWaveform, 50);
    } catch {
      // Microphone permission denied
    }
  };

  // --- Drawer handlers ---

  const drawerDrawWaveform = () => {
    const analyser = drawerAnalyserRef.current;
    const canvas = drawerCanvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    const draw = () => {
      drawerAnimFrameRef.current = requestAnimationFrame(draw);
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

  const drawerSaveTasks = async (parsedTasks: ParsedTask[]): Promise<SavedTask[]> => {
    const res = await authedFetch(
      `${API_BASE}/tend/tasks/`,
      { method: "POST", body: JSON.stringify({ tasks: parsedTasks }) },
      session.access_token
    );
    if (!res.ok) return parsedTasks.map((t) => ({ ...t, id: crypto.randomUUID() }));
    const data = await res.json();
    return data.tasks ?? [];
  };

  const drawerBuildConversation = (msgs: DrawerMessage[]) => {
    const result: { role: "user" | "assistant"; content: string }[] = [];
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.role === "user") {
        const next = msgs[i + 1];
        if (next && (next.role === "tasks" || next.role === "info")) {
          result.push({ role: "user", content: `[Already processed: "${m.text}"]` });
        } else {
          result.push({ role: "user", content: m.text });
        }
      } else if (m.role === "tasks") {
        const titles = m.tasks.map((t) => t.title).join(", ");
        result.push({ role: "assistant", content: titles ? `[Created tasks: ${titles}. Already saved — do not recreate.]` : `[Tasks were deleted.]` });
      } else if (m.role === "info") {
        result.push({ role: "assistant", content: `[${m.text}]` });
      }
    }
    return result;
  };

  const handleDrawerSubmit = async (overrideText?: string) => {
    const note = (overrideText ?? drawerInput).trim();
    if (!note || drawerProcessing) return;
    const conversation = drawerBuildConversation(drawerMessages);
    setDrawerMessages((prev) => [...prev, { role: "user", text: note }]);
    setDrawerInput("");
    setDrawerProcessing(true);
    try {
      const classifyRes = await authedFetch(
        `${API_BASE}/tend/classify/`,
        { method: "POST", body: JSON.stringify({ note, conversation }) },
        session.access_token
      );
      if (!classifyRes.ok) {
        setDrawerMessages((prev) => [...prev, { role: "info", text: "Something went wrong. Try again." }]);
        return;
      }
      const data = await classifyRes.json();
      const intent: string = data.intent ?? "notes";
      const rawTasks: ParsedTask[] = data.tasks ?? [];
      if (intent === "tasks" || intent === "ambiguous") {
        const saved = await drawerSaveTasks(rawTasks);
        setDrawerMessages((prev) => [...prev, { role: "tasks", tasks: saved }]);
        fetchTasks();
        // Highlight newly created task
        if (saved.length > 0 && saved[0].id) {
          setHighlightedTask({ id: saved[0].id, fields: [] });
          setTimeout(() => setHighlightedTask(null), 3000);
        }
      } else {
        setDrawerMessages((prev) => [...prev, { role: "info", text: "That sounds like a note about someone. Head to Notes to save it." }]);
      }
    } catch {
      setDrawerMessages((prev) => [...prev, { role: "info", text: "Something went wrong. Try again." }]);
    } finally {
      setDrawerProcessing(false);
    }
  };

  const handleDrawerRecord = async () => {
    if (drawerRecording) {
      if (drawerAnimFrameRef.current) cancelAnimationFrame(drawerAnimFrameRef.current);
      drawerAudioCtxRef.current?.close();
      drawerMediaRecorderRef.current?.stop();
      setDrawerRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      drawerAudioChunksRef.current = [];
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      drawerAnalyserRef.current = analyser;
      drawerAudioCtxRef.current = audioCtx;
      const mimeType =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" :
        MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" :
        MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" :
        MediaRecorder.isTypeSupported("audio/aac") ? "audio/aac" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const resolvedMime = recorder.mimeType || mimeType;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) drawerAudioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const isMp4 = resolvedMime.includes("mp4") || resolvedMime.includes("aac") || resolvedMime.includes("m4a");
        const ext = isMp4 ? "mp4" : "webm";
        const blob = new Blob(drawerAudioChunksRef.current, { type: resolvedMime || "audio/webm" });
        if (blob.size < 1000) { setDrawerTranscribing(false); return; }
        const formData = new FormData();
        formData.append("audio", blob, `recording.${ext}`);
        setDrawerTranscribing(true);
        try {
          const res = await authedFormFetch(`${API_BASE}/tend/transcribe/`, formData, session!.access_token);
          if (res.ok) {
            const data = await res.json();
            const text = data.text ?? "";
            if (text.trim()) handleDrawerSubmit(text);
          }
        } catch {
          // Silently fail
        } finally {
          setDrawerTranscribing(false);
        }
      };
      recorder.start(1000);
      drawerMediaRecorderRef.current = recorder;
      setDrawerRecording(true);
      setTimeout(drawerDrawWaveform, 50);
    } catch {
      // Microphone permission denied
    }
  };

  // --- Derived data ---

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const pendingCount = (cat: Category) =>
    cat === "all" ? pendingTasks.length : pendingTasks.filter((t) => t.category === cat).length;

  const sortTasks = (a: Task, b: Task) => {
    if (sortBy === "created") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "urgency") {
      const urgencyOrder: Record<string, number> = { high: 0, neutral: 1, low: 2 };
      const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (diff !== 0) return diff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // "due"
    const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    if (aDate !== bDate) return aDate - bDate;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  };

  const filtered = tasks
    .filter((t) => t.status === activeTab)
    .filter((t) => activeCategory === "all" || t.category === activeCategory);

  const focusedTasks = filtered.filter((t) => t.is_focused).sort(sortTasks);
  const highTasks = filtered.filter((t) => !t.is_focused && t.urgency === "high").sort(sortTasks);
  const otherTasks = filtered.filter((t) => !t.is_focused && t.urgency !== "high").sort(sortTasks);

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

  const toggleFocus = async (task: Task) => {
    const newFocused = !task.is_focused;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_focused: newFocused } : t)));
    try {
      await authedFetch(
        `${API_BASE}/tend/tasks/${task.id}/`,
        { method: "PATCH", body: JSON.stringify({ is_focused: newFocused }) },
        session.access_token
      );
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_focused: task.is_focused } : t)));
    }
  };

  const categories: Category[] = ["all", "work", "admin", "personal", "ideas"];

  const renderTaskRow = (task: Task) => {
    const isRecordingThis = recordingTaskId === task.id;
    const isProcessingThis = processingTaskId === task.id;
    const isHighlighted = highlightedTask?.id === task.id;
    const highlightFields = highlightedTask?.id === task.id ? highlightedTask.fields : [];
    const isBusy = isRecordingThis || isProcessingThis;
    const isExpanded = expandedTaskId === task.id;

    return (
      <div
        key={task.id}
        className={`group flex flex-col md:flex-row md:items-start md:gap-3 px-3 md:px-4 py-3 bg-gray-900 hover:bg-gray-900/80 transition-all duration-500 ${
          task.status === "complete" ? "opacity-50" : ""
        } ${isHighlighted ? "!bg-emerald-500/15 border-l-2 !border-l-emerald-400 animate-pulse" : ""} ${
          !isHighlighted && task.is_focused ? "border-l-2 border-l-emerald-500/40" : ""
        }`}
      >
        {/* Top row: checkbox + title (always horizontal) */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <input
            type="checkbox"
            checked={task.status === "complete"}
            onChange={() => toggleStatus(task)}
            className="mt-0.5 w-4 h-4 accent-violet-500 cursor-pointer shrink-0"
          />

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
          >
            <p className={`text-sm leading-snug transition-colors duration-500 ${
              task.status === "complete" ? "line-through text-gray-500" : "text-gray-200"
            } ${highlightFields.includes("title") ? "text-violet-300" : ""}`}>
              {task.title}
            </p>
            {task.description && (
              <p className={`text-[11px] text-gray-500 mt-0.5 transition-colors duration-500 ${
                isExpanded ? "" : "line-clamp-1"
              } ${highlightFields.includes("description") ? "text-violet-400" : ""}`}>
                {task.description}
              </p>
            )}
            {task.due_date && (() => {
              const dateStatus = getDueDateStatus(task.due_date);
              const colorClass = highlightFields.includes("due_date")
                ? "text-violet-400"
                : dateStatus === "overdue"
                ? "text-red-400"
                : dateStatus === "due-soon"
                ? "text-orange-400"
                : "text-gray-600";
              return (
                <p className={`text-[11px] mt-0.5 transition-colors duration-500 ${colorClass}`}>
                  {formatDueDate(task.due_date)}
                  {dateStatus === "overdue" && <span className="ml-1">— Overdue</span>}
                </p>
              );
            })()}

            {isProcessingThis && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                <span className="text-[11px] text-violet-400 font-medium">{processingLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom row on mobile, right column on desktop */}
        <div className="flex gap-1.5 items-center mt-2 md:mt-0 ml-7 md:ml-0 shrink-0">
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

          {task.status === "pending" && (
            <>
              <Link
                href={`/tasks/${task.id}/start`}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 transition-all opacity-0 group-hover:opacity-100"
              >
                Start
              </Link>
              <button
                onClick={() => toggleFocus(task)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all opacity-0 group-hover:opacity-100 ${
                  task.is_focused
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                }`}
              >
                {task.is_focused ? "Defocus" : "Focus"}
              </button>
            </>
          )}

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
            {isRecordingThis ? (
              <canvas
                ref={canvasRef}
                width={14}
                height={14}
                className="w-[14px] h-[14px]"
              />
            ) : isProcessingThis ? (
              <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin block" />
            ) : (
              <MicIcon size={14} />
            )}
          </button>
        </div>
      </div>
    );
  };

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
        <div className="flex flex-wrap items-center gap-2 md:gap-3 px-2 md:px-6 py-3 md:py-4 border-b border-gray-800/50">
          {/* Mobile category dropdown */}
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as Category)}
            className="md:hidden bg-gray-900 border border-gray-700/50 text-gray-300 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-500/50"
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

          {/* Sort control */}
          <div className="flex bg-gray-900 border border-gray-800/60 rounded-lg p-0.5 gap-0.5">
            {([["created", "Newest"], ["urgency", "Urgency"], ["due", "Due Date"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  sortBy === key ? "bg-gray-800 text-gray-100" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* New Task CTA */}
          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              drawerOpen
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-violet-600 hover:bg-violet-500 text-white"
            }`}
          >
            {drawerOpen ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
                </svg>
                Close
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Task
              </>
            )}
          </button>

        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto px-2 md:px-6 py-4">
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
            <div className="flex flex-col gap-6">
              {/* --- Focus section --- */}
              {focusedTasks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Focus</h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                      {focusedTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-800/40 border border-emerald-500/15 rounded-xl overflow-hidden">
                    {focusedTasks.map((task) => renderTaskRow(task))}
                  </div>
                </section>
              )}

              {/* --- High urgency section --- */}
              <section>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Urgent</h3>
                  {highTasks.length > 0 && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
                      {highTasks.length}
                    </span>
                  )}
                </div>
                {highTasks.length === 0 ? (
                  <div className="border border-dashed border-gray-800/60 rounded-xl px-4 py-6 flex items-center justify-center">
                    <p className="text-gray-600 text-xs">No urgent tasks</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-gray-800/40 border border-red-500/15 rounded-xl overflow-hidden">
                    {highTasks.map((task) => renderTaskRow(task))}
                  </div>
                )}
              </section>

              {/* --- Other tasks section --- */}
              {otherTasks.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Other Tasks</h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-500">
                      {otherTasks.length}
                    </span>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-800/40 border border-gray-800/50 rounded-xl overflow-hidden">
                    {otherTasks.map((task) => renderTaskRow(task))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task creation drawer — mobile: fixed overlay, desktop: flex sibling */}
      <div
        className={`
          fixed inset-y-0 right-0 z-[60] w-full max-w-sm
          md:relative md:inset-auto md:z-auto md:max-w-none
          flex flex-col rounded-l-2xl
          transition-all duration-300 ease-in-out
          ${drawerOpen
            ? "translate-x-0 md:translate-x-0 md:w-[25%] md:min-w-[320px] bg-black border-l border-gray-800/50 shadow-2xl shadow-black/40"
            : "translate-x-full md:translate-x-0 md:w-0 md:min-w-0 md:overflow-hidden md:border-l-0 bg-transparent pointer-events-none md:pointer-events-none"
          }
        `}
      >
        <div className="flex flex-col h-full min-w-[300px] md:min-w-[320px] overflow-hidden rounded-l-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
            <h3 className="text-base font-semibold text-gray-200">New Task</h3>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-200 hover:bg-gray-800/50 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div ref={drawerScrollRef} className="flex-1 overflow-y-auto px-4 py-4">
            {drawerMessages.length === 0 && !drawerProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <p className="text-[13px] text-gray-500">Type or speak a task</p>
                <p className="text-xs text-gray-700 mt-1.5">&quot;Follow up with Sarah by Friday&quot;</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {drawerMessages.map((msg, i) => {
                  if (msg.role === "user") {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-br-sm px-3 py-2 max-w-[90%]">
                          <p className="text-sm text-gray-200">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }
                  if (msg.role === "tasks") {
                    return (
                      <div key={i} className="flex flex-col gap-2">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                          {msg.tasks.length} task{msg.tasks.length !== 1 ? "s" : ""} created
                        </p>
                        <div className="bg-gray-900 border border-gray-800/60 rounded-2xl overflow-hidden">
                          {msg.tasks.map((task, j) => (
                            <div key={task.id} className={`px-3 py-2.5 ${j > 0 ? "border-t border-gray-800/40" : ""}`}>
                              <p className="text-sm text-gray-200 leading-snug">{task.title}</p>
                              {task.description && <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                              {task.due_date && <p className="text-[11px] text-gray-500 mt-0.5">{formatDueDate(task.due_date)}</p>}
                              <div className="flex gap-1 mt-1.5">
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${urgencyStyles[task.urgency]}`}>{task.urgency.toUpperCase()}</span>
                                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${categoryStyles[task.category]}`}>{task.category.toUpperCase()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (msg.role === "info") {
                    return (
                      <div key={i} className="bg-gray-900 border border-amber-500/20 rounded-2xl px-4 py-3.5">
                        <p className="text-sm text-gray-300">{msg.text}</p>
                        <Link href="/notes" className="text-xs text-violet-400 hover:text-violet-300 mt-2 inline-block">
                          Go to Notes &rarr;
                        </Link>
                      </div>
                    );
                  }
                  return null;
                })}
                {drawerProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-900 border border-gray-800/60 rounded-2xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-gray-800/50">
            <div className="bg-gray-900 border border-gray-800/60 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/15 transition-all">
              {drawerRecording && (
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-red-400 font-medium">Recording…</span>
                  </div>
                  <canvas ref={drawerCanvasRef} width={280} height={36} className="w-full h-9 rounded-lg bg-gray-800/40" />
                </div>
              )}
              {drawerTranscribing && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  <span className="text-[10px] text-violet-400 font-medium">Transcribing…</span>
                </div>
              )}
              <textarea
                value={drawerInput}
                onChange={(e) => setDrawerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !drawerRecording) {
                    e.preventDefault();
                    handleDrawerSubmit();
                  }
                }}
                placeholder={drawerRecording ? "Listening…" : drawerTranscribing ? "Transcribing…" : "Describe a task…"}
                rows={2}
                disabled={drawerRecording || drawerTranscribing}
                className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50 mb-2"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDrawerRecord}
                  disabled={drawerTranscribing}
                  title={drawerRecording ? "Stop recording" : "Start recording"}
                  className={`p-2 rounded-xl transition-colors disabled:opacity-40 ${
                    drawerRecording
                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  <MicIcon size={14} />
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => handleDrawerSubmit()}
                  disabled={!drawerInput.trim() || drawerProcessing || drawerRecording || drawerTranscribing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-medium transition-colors"
                >
                  {drawerProcessing ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <SendIcon />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
