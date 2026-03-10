"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { formatDueDate } from "@/lib/dates";

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

interface Motivation {
  message: string;
}

interface PlanStep {
  text: string;
  done: boolean;
}

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

// --- Timer constants ---

const PRESETS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "15 min", seconds: 15 * 60 },
  { label: "30 min", seconds: 30 * 60 },
];

const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// --- Icons ---

function BackArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// --- Component ---

export default function StartTaskPage() {
  const { session, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  // Auth guard
  useEffect(() => {
    if (!authLoading && !session) router.push("/login");
  }, [authLoading, session, router]);

  // --- Task state ---
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  // --- Motivation state ---
  const [motivation, setMotivation] = useState<Motivation | null>(null);
  const [motivationLoading, setMotivationLoading] = useState(false);
  const motivationFetchedRef = useRef(false);

  // --- Plan state ---
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [rambleInput, setRambleInput] = useState("");
  const [planLoading, setPlanLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // --- Timer state ---
  const [timerDuration, setTimerDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false); // focus mode toggle
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Voice + waveform refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- Fetch task ---
  useEffect(() => {
    if (!id || !session) return;
    setIsLoading(true);
    authedFetch(`${API_BASE}/tend/tasks/${id}/`, {}, session.access_token)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Task) => setTask(data))
      .catch(() => setMissing(true))
      .finally(() => setIsLoading(false));
  }, [id, session]);

  // --- Fetch motivation on task load (once only) ---
  useEffect(() => {
    if (!task || !session || motivationFetchedRef.current) return;
    motivationFetchedRef.current = true;
    setMotivationLoading(true);
    authedFetch(
      `${API_BASE}/tend/tasks/${task.id}/motivate/`,
      { method: "POST" },
      session.access_token
    )
      .then((r) => r.json())
      .then((data: Motivation) => setMotivation(data))
      .catch(() => {})
      .finally(() => setMotivationLoading(false));
  }, [task, session]);

  // --- Timer logic ---
  const selectPreset = (seconds: number) => {
    setTimerDuration(seconds);
    setTimeRemaining(seconds);
    setTimerRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const toggleTimer = useCallback(() => {
    if (timerRunning) {
      // Pause
      if (intervalRef.current) clearInterval(intervalRef.current);
      setTimerRunning(false);
    } else {
      // Start
      if (timeRemaining <= 0) return;
      setTimerStarted(true); // enter focus mode
      setTimerRunning(true);
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setTimerRunning(false);
            setTimerStarted(false); // exit focus mode when done
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [timerRunning, timeRemaining]);

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerStarted(false); // exit focus mode
    setTimeRemaining(timerDuration);
  };

  const exitFocusMode = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    setTimerStarted(false);
    setTimeRemaining(timerDuration);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = timerDuration > 0 ? timeRemaining / timerDuration : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

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
    const totalW = bars * barW + (bars - 1) * gap;
    const h = canvas.height;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);

      ctx.clearRect(0, 0, canvas.width, h);

      const step = Math.floor(freqData.length / (bars + 1));
      for (let i = 0; i < bars; i++) {
        const val = freqData[step * (i + 1)] / 255;
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

  // --- Plan submission (extracted so voice can call directly) ---
  const submitPlan = async (text: string) => {
    if (!text.trim() || !task || !session) return;
    setPlanLoading(true);
    try {
      const res = await authedFetch(
        `${API_BASE}/tend/tasks/${task.id}/plan/`,
        { method: "POST", body: JSON.stringify({ ramble_text: text }) },
        session.access_token
      );
      if (res.ok) {
        const data = await res.json();
        setPlanSteps(
          (data.steps ?? []).map((s: { text: string }) => ({ text: s.text, done: false }))
        );
      }
    } catch {
      /* ignore */
    } finally {
      setPlanLoading(false);
    }
  };

  // --- Voice recording with waveform ---
  const handleRecord = async () => {
    if (isRecording) {
      // Stop
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Audio context for waveform
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      analyserRef.current = analyser;
      audioCtxRef.current = audioCtx;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const resolvedMime = recorder.mimeType || mimeType;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const ext = resolvedMime.includes("mp4") || resolvedMime.includes("aac") ? "mp4" : "webm";
        const blob = new Blob(audioChunksRef.current, { type: resolvedMime || "audio/webm" });
        if (blob.size < 1000) return;
        const formData = new FormData();
        formData.append("audio", blob, `recording.${ext}`);
        setIsTranscribing(true);
        try {
          const res = await authedFormFetch(`${API_BASE}/tend/transcribe/`, formData, session!.access_token);
          if (res.ok) {
            const data = await res.json();
            if (data.text?.trim()) {
              const text = data.text.trim();
              setRambleInput(text);
              // Auto-submit plan
              submitPlan(text);
            }
          }
        } catch {
          /* ignore */
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Start waveform after a tick so canvas is rendered
      setTimeout(() => drawMiniWaveform(), 50);
    } catch {
      /* mic denied */
    }
  };

  const handlePlanSubmit = () => {
    submitPlan(rambleInput);
  };

  const toggleStep = (index: number) => {
    setPlanSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, done: !s.done } : s))
    );
  };

  // --- Loading / error states ---
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="w-6 h-6 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (missing || !task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500 text-sm">Task not found.</p>
        <Link href="/tasks" className="text-violet-400 hover:text-violet-300 text-sm">
          Back to Tasks
        </Link>
      </div>
    );
  }

  // =====================================================================
  // FOCUS MODE — minimal view: timer + title + steps
  // =====================================================================
  if (timerStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-6rem)] md:min-h-[calc(100dvh-4rem)] px-4 relative">
        {/* Exit button — top left corner */}
        <button
          onClick={exitFocusMode}
          className="absolute top-0 left-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          <BackArrowIcon /> Exit
        </button>

        {/* Timer */}
        <div className="w-full max-w-[280px] mb-6">
          <svg width="100%" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle
              cx="110" cy="110" r={RADIUS}
              fill="none" stroke="#8b5cf6" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 110 110)"
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
            <text
              x="110" y="110"
              textAnchor="middle" dominantBaseline="central"
              fill="#f3f4f6"
              style={{ fontSize: 36, fontFamily: "var(--font-mono)" }}
            >
              {formatTime(timeRemaining)}
            </text>
          </svg>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            {timerRunning ? <><PauseIcon /> Pause</> : <><PlayIcon /> Resume</>}
          </button>
          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50 text-sm font-medium transition-colors"
          >
            <ResetIcon /> Reset
          </button>
        </div>

        {/* Task title */}
        <h1 className="text-xl font-semibold text-gray-100 text-center mb-6 max-w-lg">{task.title}</h1>

        {/* Plan steps (if any) */}
        {planSteps.length > 0 && (
          <div className="w-full max-w-md flex flex-col divide-y divide-gray-800/40 border border-gray-800/50 rounded-xl overflow-hidden">
            {planSteps.map((step, i) => (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-900/80 transition-colors"
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    step.done ? "bg-emerald-500 border-emerald-500" : "border-gray-600"
                  }`}
                >
                  {step.done && <CheckIcon />}
                </span>
                <span
                  className={`text-sm transition-all ${
                    step.done ? "line-through text-gray-500" : "text-gray-200"
                  }`}
                >
                  {step.text}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Timer done notification */}
        {timerDuration > 0 && timeRemaining === 0 && !timerRunning && (
          <div className="mt-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
            <p className="text-sm text-emerald-400 font-medium">Time&apos;s up!</p>
          </div>
        )}
      </div>
    );
  }

  // =====================================================================
  // PLANNING MODE — full page with all sections
  // =====================================================================
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* === LEFT COLUMN (2/3) === */}
        <div className="flex-[2] min-w-0 flex flex-col gap-6">
          {/* Back link */}
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors w-fit"
          >
            <BackArrowIcon /> Back to Tasks
          </Link>

          {/* Task Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-100 mb-2">{task.title}</h1>
            {task.description && (
              <p className="text-sm text-gray-400 leading-relaxed mb-3">{task.description}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${urgencyStyles[task.urgency]}`}
              >
                {task.urgency.toUpperCase()}
              </span>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryStyles[task.category]}`}
              >
                {task.category.toUpperCase()}
              </span>
              {task.due_date && (
                <span className="text-[10px] text-gray-500 px-2 py-0.5">
                  Due: {formatDueDate(task.due_date)}
                </span>
              )}
            </div>
          </div>

          {/* Plan steps checklist (shown above input when generated) */}
          {planSteps.length > 0 && (
            <div className="flex flex-col divide-y divide-gray-800/40 border border-gray-800/50 rounded-xl overflow-hidden">
              {planSteps.map((step, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(i)}
                  className="flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-900/80 transition-colors"
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      step.done ? "bg-emerald-500 border-emerald-500" : "border-gray-600"
                    }`}
                  >
                    {step.done && <CheckIcon />}
                  </span>
                  <span
                    className={`text-sm transition-all ${
                      step.done ? "line-through text-gray-500" : "text-gray-200"
                    }`}
                  >
                    {step.text}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Task Plan Section */}
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Task Plan
            </h2>

            {/* Input card */}
            <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-4">
              {isTranscribing && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  <span className="text-xs text-violet-400 font-medium">Transcribing...</span>
                </div>
              )}
              {planLoading && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                  <span className="text-xs text-violet-400 font-medium">Generating plan...</span>
                </div>
              )}
              <textarea
                value={rambleInput}
                onChange={(e) => setRambleInput(e.target.value)}
                placeholder="Ramble about your plan... what do you need to do? AI will organize it into steps."
                rows={3}
                disabled={isRecording || isTranscribing || planLoading}
                className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50 mb-3"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRecord}
                  disabled={isTranscribing || planLoading}
                  className={`p-2 rounded-xl transition-colors ${
                    isRecording
                      ? "bg-red-500/15 text-red-400 border border-red-500/30"
                      : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50"
                  }`}
                >
                  {isRecording ? (
                    <canvas
                      ref={canvasRef}
                      width={14}
                      height={14}
                      className="w-[14px] h-[14px]"
                    />
                  ) : (
                    <MicIcon />
                  )}
                </button>
                <div className="flex-1" />
                {/* Regenerate button — for manual re-submission after editing */}
                <button
                  onClick={handlePlanSubmit}
                  disabled={!rambleInput.trim() || planLoading || isTranscribing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-medium transition-colors"
                >
                  <SendIcon /> {planSteps.length > 0 ? "Regenerate" : "Generate Plan"}
                </button>
              </div>
            </div>
          </section>

          {/* Encouraging message (at bottom) */}
          {motivationLoading ? (
            <div className="flex items-center gap-2 py-2">
              <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Getting you ready...</span>
            </div>
          ) : motivation?.message ? (
            <p className="text-sm text-gray-500 italic">{motivation.message}</p>
          ) : null}
        </div>

        {/* === RIGHT COLUMN (1/3) === */}
        <div className="flex-1 min-w-[280px] flex flex-col items-center gap-6 lg:sticky lg:top-8 lg:self-start">
          {/* Timer Circle */}
          <div className="w-full max-w-[260px]">
            <svg width="100%" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="#1f2937" strokeWidth="8" />
              <circle
                cx="110" cy="110" r={RADIUS}
                fill="none" stroke="#8b5cf6" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 110 110)"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
              <text
                x="110" y="110"
                textAnchor="middle" dominantBaseline="central"
                fill="#f3f4f6"
                style={{ fontSize: 36, fontFamily: "var(--font-mono)" }}
              >
                {formatTime(timeRemaining)}
              </text>
            </svg>
          </div>

          {/* Preset buttons */}
          <div className="flex gap-2 flex-wrap justify-center">
            {PRESETS.map((p) => (
              <button
                key={p.seconds}
                onClick={() => selectPreset(p.seconds)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timerDuration === p.seconds
                    ? "bg-violet-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={toggleTimer}
              disabled={timerDuration === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm font-medium transition-colors"
            >
              {timerRunning ? (
                <><PauseIcon /> Pause</>
              ) : (
                <><PlayIcon /> Start</>
              )}
            </button>
            <button
              onClick={resetTimer}
              disabled={timerDuration === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50 text-sm font-medium transition-colors"
            >
              <ResetIcon /> Reset
            </button>
          </div>

          {/* Timer done notification */}
          {timerDuration > 0 && timeRemaining === 0 && !timerRunning && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
              <p className="text-sm text-emerald-400 font-medium">Time&apos;s up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
