"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
import { Task, urgencyStyles, categoryStyles } from "@/lib/task-types";
import { formatDueDate, getDueDateStatus } from "@/lib/dates";

// --- Icons (local to modal) ---

function MicIcon({ size = 18 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}

// --- Props ---

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onTaskUpdate: (updated: Task) => void;
  token: string;
}

export default function TaskDetailModal({ task, onClose, onTaskUpdate, token }: TaskDetailModalProps) {
  // Editable fields
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editUrgency, setEditUrgency] = useState(task.urgency);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editFocused, setEditFocused] = useState(task.is_focused);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Re-sync state when task prop changes (parent optimistic update)
  useEffect(() => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditUrgency(task.urgency);
    setEditCategory(task.category);
    setEditFocused(task.is_focused);
  }, [task.id, task.title, task.description, task.urgency, task.category, task.is_focused]);

  // Escape key + body scroll lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      mediaRecorderRef.current?.stop();
    };
  }, []);

  // --- Auto-save helper ---
  const patchField = useCallback(
    async (field: string, value: unknown) => {
      const updated = { ...task, [field]: value };
      onTaskUpdate(updated);
      try {
        await authedFetch(
          `${API_BASE}/tend/tasks/${task.id}/`,
          { method: "PATCH", body: JSON.stringify({ [field]: value }) },
          token
        );
      } catch {
        onTaskUpdate(task); // revert
      }
    },
    [task, token, onTaskUpdate]
  );

  // --- Title edit handlers ---
  const startEditTitle = () => {
    setIsEditingTitle(true);
    setTimeout(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }, 0);
  };

  const saveTitle = () => {
    setIsEditingTitle(false);
    const trimmed = editTitle.trim();
    if (!trimmed) {
      setEditTitle(task.title);
      return;
    }
    if (trimmed !== task.title) {
      patchField("title", trimmed);
    }
  };

  // --- Description save ---
  const saveDescription = () => {
    if (editDescription !== task.description) {
      patchField("description", editDescription);
    }
  };

  // --- Dropdown handlers ---
  const handleUrgencyChange = (val: Task["urgency"]) => {
    setEditUrgency(val);
    patchField("urgency", val);
  };

  const handleCategoryChange = (val: Task["category"]) => {
    setEditCategory(val);
    patchField("category", val);
  };

  const handleFocusToggle = () => {
    const next = !editFocused;
    setEditFocused(next);
    patchField("is_focused", next);
  };

  // --- Mini waveform ---
  const drawMiniWaveform = () => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const bars = 5;
    const barW = 3;
    const gap = 2;
    const totalW = bars * barW + (bars - 1) * gap;
    const h = canvas.height;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(freqData);
      ctx.clearRect(0, 0, canvas.width, h);

      const step = Math.floor(freqData.length / (bars + 1));
      for (let i = 0; i < bars; i++) {
        const val = freqData[step * (i + 1)] / 255;
        const barH = Math.max(3, val * h);
        const x = i * (barW + gap) + (canvas.width - totalW) / 2;
        const y = (h - barH) / 2;
        ctx.fillStyle = "#f87171";
        ctx.beginPath();
        ctx.roundRect(x, y, barW, barH, 1);
        ctx.fill();
      }
    };
    draw();
  };

  // --- Voice recording ---
  const handleRecord = async () => {
    if (isRecording) {
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

        setIsProcessing(true);
        setProcessingLabel("Transcribing…");

        try {
          const res = await authedFormFetch(
            `${API_BASE}/tend/tasks/${task.id}/voice-update-direct/`,
            formData,
            token
          );
          if (res.ok) {
            const data = await res.json();
            if (data.action === "update" && data.task) {
              setProcessingLabel("Updating…");
              onTaskUpdate(data.task);
            }
          }
        } catch {
          /* ignore */
        } finally {
          setIsProcessing(false);
          setProcessingLabel("");
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setTimeout(() => drawMiniWaveform(), 50);
    } catch {
      /* mic denied */
    }
  };

  // --- Due date display ---
  const dateStatus = task.due_date ? getDueDateStatus(task.due_date) : null;
  const dateColor = dateStatus === "overdue" ? "text-red-400" : dateStatus === "due-soon" ? "text-orange-400" : "text-gray-500";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full md:h-auto md:max-h-[80vh] md:w-[700px] bg-gray-950 md:border md:border-gray-800/50 md:rounded-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50 shrink-0">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Task Details</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" x2="6" y1="6" y2="18" /><line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
            {/* --- Left column --- */}
            <div className="flex flex-col gap-4 min-w-0">
              {/* Title — click to edit */}
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                  className="text-lg font-semibold text-gray-100 bg-gray-900 border border-gray-700/50 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500/60 transition-colors w-full"
                />
              ) : (
                <h2
                  onClick={startEditTitle}
                  className="text-lg font-semibold text-gray-100 cursor-pointer hover:text-violet-300 transition-colors py-2 px-0.5 -ml-0.5 rounded"
                  title="Click to edit title"
                >
                  {task.title}
                </h2>
              )}

              {/* Description — always editable textarea */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={saveDescription}
                  placeholder="Add a description…"
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-800/60 rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-violet-500/60 transition-colors resize-y"
                />
              </div>

              {/* Voice edit section */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Voice Edit</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRecord}
                    disabled={isProcessing}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isRecording
                        ? "bg-red-500/15 text-red-400 border border-red-500/30"
                        : "bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-800/60 hover:border-gray-700/50"
                    } disabled:opacity-40`}
                  >
                    {isRecording ? (
                      <>
                        <canvas ref={canvasRef} width={20} height={16} className="w-5 h-4" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <MicIcon size={16} />
                        <span>Record</span>
                      </>
                    )}
                  </button>

                  {isProcessing && (
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                      <span className="text-xs text-violet-400">{processingLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Due date */}
              {task.due_date && (
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Date</label>
                  <p className={`text-sm ${dateColor}`}>
                    {formatDueDate(task.due_date)}
                    {dateStatus === "overdue" && <span className="ml-1">— Overdue</span>}
                  </p>
                </div>
              )}
            </div>

            {/* --- Right column --- */}
            <div className="flex flex-col gap-4">
              {/* Urgency dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Urgency</label>
                <select
                  value={editUrgency}
                  onChange={(e) => handleUrgencyChange(e.target.value as Task["urgency"])}
                  className={`w-full text-xs font-medium px-3 py-2 rounded-lg border transition-colors cursor-pointer focus:outline-none ${urgencyStyles[editUrgency]} bg-transparent`}
                >
                  <option value="high" className="bg-gray-900 text-red-400">🔴 High</option>
                  <option value="neutral" className="bg-gray-900 text-amber-400">🟡 Neutral</option>
                  <option value="low" className="bg-gray-900 text-gray-400">⚪ Low</option>
                </select>
              </div>

              {/* Category dropdown */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as Task["category"])}
                  className={`w-full text-xs font-medium px-3 py-2 rounded-lg border transition-colors cursor-pointer focus:outline-none ${categoryStyles[editCategory]} bg-transparent`}
                >
                  <option value="work" className="bg-gray-900 text-blue-400">💼 Work</option>
                  <option value="admin" className="bg-gray-900 text-orange-400">📋 Admin</option>
                  <option value="personal" className="bg-gray-900 text-pink-400">👤 Personal</option>
                  <option value="ideas" className="bg-gray-900 text-violet-400">💡 Ideas</option>
                </select>
              </div>

              {/* Focus toggle */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Focus</label>
                <button
                  onClick={handleFocusToggle}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    editFocused
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-gray-900 text-gray-500 border-gray-800/60 hover:text-gray-300"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                    editFocused ? "border-emerald-400 bg-emerald-500" : "border-gray-600"
                  }`}>
                    {editFocused && (
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  {editFocused ? "Focused" : "Not focused"}
                </button>
              </div>

              {/* Status display */}
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${
                  task.status === "complete"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${task.status === "complete" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  {task.status === "complete" ? "Complete" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800/50 shrink-0">
          <Link
            href={`/tasks/${task.id}/start`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6 3 20 12 6 21 6 3" />
            </svg>
            Start
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors border border-gray-700/50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
