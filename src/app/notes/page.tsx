"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { formatDueDate } from "@/lib/dates";

// --- Typing prompts ---

const prompts = [
  "Who did you meet today?",
  "How was that coffee chat?",
  "Any tasks on your mind?",
  "Who made an impression on you recently?",
  "Any interesting conversations worth remembering?",
  "What do you need to get done?",
];

function TypingPrompt() {
  const [displayText, setDisplayText] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const currentPrompt = prompts[promptIndex];

    if (!isDeleting) {
      if (displayText.length < currentPrompt.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(currentPrompt.slice(0, displayText.length + 1));
        }, 18 + Math.random() * 15);
      } else {
        timeoutRef.current = setTimeout(() => setIsDeleting(true), 1500);
      }
    } else {
      if (displayText.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 10);
      } else {
        setIsDeleting(false);
        setPromptIndex((prev) => (prev + 1) % prompts.length);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayText, isDeleting, promptIndex]);

  return (
    <span className="text-gray-100">
      {displayText}
      <span className="inline-block w-[2px] h-7 bg-violet-400 ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

// --- Types ---

interface ParsedPerson {
  name: string;
  note_about_them: string;
  tags: string[];
  interaction_date: string;
  energy_level: "energised" | "neutral" | "drained" | null;
}

interface ParsedTask {
  title: string;
  description: string;
  due_date: string | null;
  urgency: "low" | "neutral" | "high";
  category: "work" | "admin" | "personal" | "ideas";
}

// After auto-saving — have backend IDs for deletion
interface SavedTask extends ParsedTask { id: string; }
interface SavedPerson extends ParsedPerson { id: string; }

interface DisambiguationItem {
  person: ParsedPerson;
  candidates: SavedPerson[];
}

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "notes"; people: SavedPerson[]; error?: string }
  | { role: "tasks"; tasks: SavedTask[] }
  | { role: "ambiguous"; pendingText: string; tasks: ParsedTask[]; people: ParsedPerson[] }
  | { role: "disambiguate"; items: DisambiguationItem[]; savedAlongside: SavedPerson[] }
  | { role: "no_person"; originalNote: string };

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

function TrashIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// --- Person card ---

function PersonCard({
  person,
  onDelete,
}: {
  person: SavedPerson;
  onDelete: () => void;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-5 relative group">
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
        title="Delete contact"
      >
        <TrashIcon size={13} />
      </button>

      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(person.name)}`}
          alt={person.name}
          width={40}
          height={40}
          className="rounded-full bg-gray-800 shrink-0"
        />
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-semibold text-gray-100">{person.name}</p>
          {person.interaction_date && (
            <p className="text-[11px] text-gray-500 mt-0.5">{person.interaction_date}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mb-3">{person.note_about_them}</p>

      {person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {person.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Component ---

export default function NotesPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) router.push("/login");
  }, [loading, session, router]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isProcessing]);

  if (loading || !session) return null;

  const hasStarted = messages.length > 0 || isProcessing;

  // Build conversation history — sanitize already-processed messages
  // so the AI doesn't re-extract tasks/people from old user inputs.
  const buildConversation = (msgs: ChatMessage[]) => {
    const result: { role: "user" | "assistant"; content: string }[] = [];
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i];
      if (m.role === "user") {
        const next = msgs[i + 1];
        // If the next message is a response, this input was already processed
        if (next && (next.role === "tasks" || next.role === "notes" || next.role === "ambiguous")) {
          result.push({ role: "user", content: `[Already processed: "${m.text}"]` });
        } else {
          result.push({ role: "user", content: m.text });
        }
      } else if (m.role === "tasks") {
        const titles = m.tasks.map((t) => t.title).join(", ");
        result.push({
          role: "assistant",
          content: titles
            ? `[Created tasks: ${titles}. Already saved — do not recreate.]`
            : `[Tasks were created then deleted by user. Ignore the preceding message entirely.]`,
        });
      } else if (m.role === "notes") {
        result.push({
          role: "assistant",
          content: `[Saved contacts: ${m.people.map((p) => p.name).join(", ")}]`,
        });
      } else if (m.role === "ambiguous") {
        result.push({ role: "assistant", content: "[Asked user to clarify intent]" });
      } else if (m.role === "disambiguate") {
        const names = [...m.savedAlongside.map((p) => p.name), ...m.items.map((d) => d.person.name)];
        result.push({ role: "assistant", content: `[Saving/resolving contacts: ${names.join(", ")}]` });
      } else if (m.role === "no_person") {
        result.push({ role: "assistant", content: "[Asked user to provide a name for the note]" });
      }
    }
    return result;
  };

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

  // Auto-save helpers called from handleSubmit
  const saveContacts = async (people: ParsedPerson[]): Promise<{ saved: SavedPerson[]; needsDisambiguation: DisambiguationItem[] }> => {
    const res = await authedFetch(
      `${API_BASE}/tend/save-contacts/`,
      { method: "POST", body: JSON.stringify({ people }) },
      session.access_token
    );
    if (!res.ok) return { saved: people.map((p) => ({ ...p, id: crypto.randomUUID() })), needsDisambiguation: [] };
    const data = await res.json();
    const saved: SavedPerson[] = data.saved ?? [];
    const needsDisambiguation: DisambiguationItem[] = (data.needs_disambiguation ?? []).map(
      (d: { person: ParsedPerson; candidates: SavedPerson[] }) => ({
        person: d.person,
        candidates: d.candidates,
      })
    );
    return { saved, needsDisambiguation };
  };

  const saveTasks = async (tasks: ParsedTask[]): Promise<SavedTask[]> => {
    const res = await authedFetch(
      `${API_BASE}/tend/tasks/`,
      { method: "POST", body: JSON.stringify({ tasks }) },
      session.access_token
    );
    if (!res.ok) return tasks.map((t) => ({ ...t, id: crypto.randomUUID() }));
    const data = await res.json();
    return data.tasks ?? [];
  };

  const handleRecord = async () => {
    if (isRecording) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioCtxRef.current?.close();
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
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
          if (blob.size < 1000) {
            setIsTranscribing(false);
            return;
          }
          const formData = new FormData();
          formData.append("audio", blob, `recording.${ext}`);

          setIsTranscribing(true);
          try {
            const res = await authedFormFetch(
              `${API_BASE}/tend/transcribe/`,
              formData,
              session.access_token
            );
            if (res.ok) {
              const data = await res.json();
              const text = data.text ?? "";
              if (text.trim()) {
                // Auto-submit: voice notes go straight to classify
                handleSubmit(text);
              }
            }
          } catch {
            // Transcription failed silently
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setTimeout(drawWaveform, 50);
      } catch {
        // Microphone permission denied
      }
    }
  };

  const handleSubmit = async (overrideText?: string) => {
    const note = (overrideText ?? input).trim();
    if (!note || isProcessing) return;

    const conversation = buildConversation(messages);

    setMessages((prev) => [...prev, { role: "user", text: note }]);
    setInput("");
    setIsProcessing(true);

    try {
      // Step 1: classify
      const classifyRes = await authedFetch(
        `${API_BASE}/tend/classify/`,
        { method: "POST", body: JSON.stringify({ note, conversation }) },
        session.access_token
      );

      if (!classifyRes.ok) {
        const err = await classifyRes.json().catch(() => ({}));
        setMessages((prev) => [...prev, { role: "notes", people: [], error: err.error ?? `Server error ${classifyRes.status}` }]);
        return;
      }

      const data = await classifyRes.json();
      const intent: string = data.intent ?? "notes";
      const rawTasks: ParsedTask[] = data.tasks ?? [];
      const people: ParsedPerson[] = data.people ?? [];

      // Step 2: auto-save based on intent
      if (intent === "tasks") {
        const saved = await saveTasks(rawTasks);
        setMessages((prev) => [...prev, { role: "tasks", tasks: saved }]);
      } else if (intent === "ambiguous") {
        // Don't save yet — wait for user to resolve
        setMessages((prev) => [...prev, { role: "ambiguous", pendingText: note, tasks: rawTasks, people }]);
      } else {
        // notes (default)
        if (people.length === 0) {
          // Classifier said "notes" but parser found no people — ask for a name
          setMessages((prev) => [...prev, { role: "no_person", originalNote: note }]);
        } else {
          const { saved, needsDisambiguation } = await saveContacts(people);
          if (needsDisambiguation.length > 0) {
            if (saved.length > 0) {
              setMessages((prev) => [...prev, { role: "notes", people: saved }]);
            }
            setMessages((prev) => [...prev, { role: "disambiguate", items: needsDisambiguation, savedAlongside: saved }]);
          } else {
            setMessages((prev) => [...prev, { role: "notes", people: saved }]);
          }
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "notes", people: [], error: "Something went wrong. Is the backend running?" }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteTask = async (msgIndex: number, taskId: string) => {
    // Optimistic UI
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIndex || m.role !== "tasks") return m;
        return { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) };
      })
    );
    await authedFetch(
      `${API_BASE}/tend/tasks/${taskId}/`,
      { method: "DELETE" },
      session.access_token
    ).catch(() => {/* silently ignore */});
  };

  const handleDeleteContact = async (msgIndex: number, contactId: string) => {
    // Optimistic UI
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== msgIndex || m.role !== "notes") return m;
        return { ...m, people: m.people.filter((p) => p.id !== contactId) };
      })
    );
    await authedFetch(
      `${API_BASE}/tend/contacts/${contactId}/`,
      { method: "DELETE" },
      session.access_token
    ).catch(() => {/* silently ignore */});
  };

  const handleResolveAmbiguous = async (msgIndex: number, intent: "tasks" | "notes") => {
    const msg = messages[msgIndex];
    if (msg.role !== "ambiguous") return;

    setIsProcessing(true);
    try {
      if (intent === "tasks") {
        const saved = await saveTasks(msg.tasks);
        setMessages((prev) => [...prev, { role: "tasks", tasks: saved }]);
      } else {
        const { saved, needsDisambiguation } = await saveContacts(msg.people);
        if (needsDisambiguation.length > 0) {
          if (saved.length > 0) {
            setMessages((prev) => [...prev, { role: "notes", people: saved }]);
          }
          setMessages((prev) => [...prev, { role: "disambiguate", items: needsDisambiguation, savedAlongside: saved }]);
        } else {
          setMessages((prev) => [...prev, { role: "notes", people: saved }]);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveDisambiguation = async (msgIndex: number, itemIndex: number, contactId: string | null) => {
    const msg = messages[msgIndex];
    if (msg.role !== "disambiguate") return;

    const item = msg.items[itemIndex];
    if (!item) return;

    try {
      const res = await authedFetch(
        `${API_BASE}/tend/save-contacts/resolve/`,
        {
          method: "POST",
          body: JSON.stringify({
            contact_id: contactId,
            person: item.person,
          }),
        },
        session.access_token
      );

      if (!res.ok) return;
      const data = await res.json();
      const resolvedContact: SavedPerson = data.contact;

      setMessages((prev) =>
        prev.map((m, i) => {
          if (i !== msgIndex || m.role !== "disambiguate") return m;
          const remainingItems = m.items.filter((_, idx) => idx !== itemIndex);
          const newSaved = [...m.savedAlongside, resolvedContact];
          // All resolved → convert to notes message
          if (remainingItems.length === 0) {
            return { role: "notes" as const, people: newSaved };
          }
          return { ...m, items: remainingItems, savedAlongside: newSaved };
        })
      );
    } catch {
      // Silently fail
    }
  };

  const handleResolveNoPerson = async (msgIndex: number, name: string) => {
    const msg = messages[msgIndex];
    if (msg.role !== "no_person") return;

    const trimmed = name.trim();
    if (!trimmed) return;

    setIsProcessing(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const person: ParsedPerson = {
        name: trimmed,
        note_about_them: msg.originalNote,
        tags: [],
        interaction_date: today,
        energy_level: null,
      };
      const { saved, needsDisambiguation } = await saveContacts([person]);

      // Remove the no_person message and replace with result
      setMessages((prev) => {
        const without = prev.filter((_, idx) => idx !== msgIndex);
        if (needsDisambiguation.length > 0) {
          return [...without,
            ...(saved.length > 0 ? [{ role: "notes" as const, people: saved }] : []),
            { role: "disambiguate" as const, items: needsDisambiguation, savedAlongside: saved },
          ];
        }
        return [...without, { role: "notes" as const, people: saved }];
      });
    } catch {
      // Silently fail
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setMessages([]);
    setIsRecording(false);
  };

  const inputBar = (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/15 transition-all">
        {isRecording && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">Recording…</span>
              <span className="text-xs text-gray-600 ml-auto">Tap mic to stop</span>
            </div>
            <canvas
              ref={canvasRef}
              width={560}
              height={48}
              className="w-full h-12 rounded-lg bg-gray-800/40"
            />
          </div>
        )}

        {isTranscribing && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3.5 h-3.5 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
            <span className="text-xs text-violet-400 font-medium">Transcribing…</span>
          </div>
        )}

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isRecording) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            isRecording
              ? "Listening…"
              : isTranscribing
              ? "Transcribing…"
              : hasStarted
              ? "Continue the conversation…"
              : "I met Sarah today, or: I need to get back to Sam…"
          }
          rows={3}
          disabled={isRecording || isTranscribing}
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50 mb-3"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecord}
            disabled={isTranscribing}
            title={isRecording ? "Stop recording" : "Start recording"}
            className={`p-2 rounded-xl transition-colors disabled:opacity-40 ${
              isRecording
                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50 hover:border-gray-600"
            }`}
          >
            <MicIcon size={14} />
          </button>

          <div className="flex-1" />

          {hasStarted && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isProcessing || isRecording || isTranscribing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white text-xs font-medium transition-colors"
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <SendIcon />
                Submit
              </>
            )}
          </button>
        </div>
      </div>
      <p className="text-[10px] text-gray-700 text-center mt-2">
        Your notes stay private and are never shared.
      </p>
    </div>
  );

  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-6rem)] md:h-[calc(100dvh-4rem)] md:-mt-8 px-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </div>
        <div className="text-xl sm:text-2xl font-light text-center h-9 mb-8">
          <TypingPrompt />
        </div>
        {inputBar}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-4rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto py-6 flex flex-col gap-6">
          {messages.map((msg, i) => {
            // User bubble
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-200">{msg.text}</p>
                  </div>
                </div>
              );
            }

            // Notes message (people cards)
            if (msg.role === "notes") {
              return (
                <div key={i} className="flex flex-col gap-4">
                  {msg.error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                      <p className="text-xs text-red-400">{msg.error}</p>
                    </div>
                  ) : msg.people.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800/60 rounded-xl px-4 py-4">
                      <p className="text-sm text-gray-400">No people detected. Try mentioning someone by name!</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        {msg.people.length} profile{msg.people.length !== 1 ? "s" : ""} saved — tap trash to delete
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.people.map((person) => (
                          <PersonCard
                            key={person.id}
                            person={person}
                            onDelete={() => handleDeleteContact(i, person.id)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            // No person detected — ask for a name
            if (msg.role === "no_person") {
              return (
                <div key={i} className="flex flex-col gap-3">
                  <div className="bg-gray-900 border border-amber-500/20 rounded-xl px-4 py-4">
                    <p className="text-sm text-gray-300 mb-3">
                      I understood this as a note about someone, but couldn&apos;t detect a name. Who is this about?
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const nameInput = form.elements.namedItem("personName") as HTMLInputElement;
                        if (nameInput?.value.trim()) {
                          handleResolveNoPerson(i, nameInput.value);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        name="personName"
                        type="text"
                        placeholder="Enter a name…"
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700/40 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
                      >
                        Save
                      </button>
                    </form>
                  </div>
                </div>
              );
            }

            // Tasks message
            if (msg.role === "tasks") {
              return (
                <div key={i} className="flex flex-col gap-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    {msg.tasks.length} task{msg.tasks.length !== 1 ? "s" : ""} created — tap trash to delete
                  </p>
                  <div className="bg-gray-900 border border-gray-800/60 rounded-xl overflow-hidden">
                    {msg.tasks.length === 0 ? (
                      <div className="px-4 py-4">
                        <p className="text-sm text-gray-500">All tasks deleted.</p>
                      </div>
                    ) : (
                      msg.tasks.map((task, j) => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 px-4 py-3.5 ${j > 0 ? "border-t border-gray-800/40" : ""}`}
                        >
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => router.push(`/tasks?highlight=${task.id}`)}
                          >
                            <p className="text-sm text-gray-200 leading-snug">{task.title}</p>
                            {task.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                            )}
                            {task.due_date && (
                              <p className="text-[11px] text-gray-500 mt-0.5">{formatDueDate(task.due_date)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${urgencyStyles[task.urgency]}`}>
                              {task.urgency.toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryStyles[task.category]}`}>
                              {task.category.toUpperCase()}
                            </span>
                            <button
                              onClick={() => handleDeleteTask(i, task.id)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                              title="Delete task"
                            >
                              <TrashIcon size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            }

            // Ambiguous message
            if (msg.role === "ambiguous") {
              return (
                <div key={i} className="flex flex-col gap-3">
                  <div className="bg-gray-900 border border-amber-500/20 rounded-xl px-4 py-4">
                    <p className="text-sm text-gray-300 mb-3">
                      Not sure — is this something you need to do, or a note about someone?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveAmbiguous(i, "tasks")}
                        className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-xs font-medium hover:bg-violet-600/30 transition-colors"
                      >
                        📋 It&apos;s a task
                      </button>
                      <button
                        onClick={() => handleResolveAmbiguous(i, "notes")}
                        className="px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
                      >
                        👤 It&apos;s a note about someone
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Disambiguation — "Did you mean?" for fuzzy contact matches
            if (msg.role === "disambiguate") {
              return (
                <div key={i} className="flex flex-col gap-4">
                  {msg.savedAlongside.length > 0 && (
                    <>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                        {msg.savedAlongside.length} profile{msg.savedAlongside.length !== 1 ? "s" : ""} saved
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.savedAlongside.map((person) => (
                          <PersonCard key={person.id} person={person} onDelete={() => handleDeleteContact(i, person.id)} />
                        ))}
                      </div>
                    </>
                  )}

                  {msg.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-gray-900 border border-amber-500/20 rounded-xl px-4 py-4">
                      <p className="text-sm text-gray-300 mb-1">
                        Did you mean <span className="font-semibold text-amber-400">{item.person.name}</span>?
                      </p>
                      {item.person.note_about_them && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">&quot;{item.person.note_about_them}&quot;</p>
                      )}

                      <div className="flex flex-col gap-2">
                        {item.candidates.map((candidate) => (
                          <button
                            key={candidate.id}
                            onClick={() => handleResolveDisambiguation(i, itemIdx, candidate.id)}
                            className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg bg-gray-800/50 border border-gray-700/40 hover:border-violet-500/40 hover:bg-gray-800 transition-colors"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(candidate.name)}`}
                              alt={candidate.name}
                              width={32}
                              height={32}
                              className="rounded-full bg-gray-800 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-200">{candidate.name}</p>
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {candidate.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="px-1.5 py-0 rounded-full bg-violet-500/10 text-violet-400 text-[9px]">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </button>
                        ))}

                        <button
                          onClick={() => handleResolveDisambiguation(i, itemIdx, null)}
                          className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg border border-dashed border-gray-700/60 hover:border-violet-500/40 hover:bg-gray-800/30 transition-colors"
                        >
                          <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                              <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
                            </svg>
                          </span>
                          <p className="text-sm text-gray-400">Create new contact &quot;{item.person.name}&quot;</p>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            return null;
          })}

          {/* Typing indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800/60 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pb-6 pt-4 px-4">
        {inputBar}
      </div>
    </div>
  );
}
