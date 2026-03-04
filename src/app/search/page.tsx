"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

const prompts = [
  "Who do I know who plays padel?",
  "Who can I contact to learn more about AI?",
  "Who do I know that lives in the Middle East?",
  "Who in my network could advise me on learning guitar?",
  "Who works in climate tech and is based in London?",
  "Who could help me think about moving to Dubai?",
  "Who do I know in venture capital?",
];

interface ResultPerson {
  id: string;
  name: string;
  avatarSeed: string;
  lastContactedDaysAgo: number;
  summary: string;
  reason: string;
}

interface AssistantMessage {
  intro: string;
  results: ResultPerson[];
}

function daysAgo(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

// --- Sub-components ---

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
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [displayText, isDeleting, promptIndex]);

  return (
    <span className="text-gray-100">
      {displayText}
      <span className="inline-block w-[2px] h-7 bg-violet-400 ml-0.5 align-middle animate-pulse" />
    </span>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

function PersonCard({ person }: { person: ResultPerson }) {
  const chipColor =
    person.lastContactedDaysAgo <= 7
      ? "bg-emerald-500/15 text-emerald-400"
      : person.lastContactedDaysAgo <= 30
      ? "bg-amber-500/15 text-amber-400"
      : "bg-red-500/15 text-red-400";

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(person.avatarSeed)}`}
          alt={person.name}
          width={36}
          height={36}
          className="rounded-full bg-gray-700 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-100">{person.name}</p>
          <p className="text-xs text-gray-500 truncate">{person.summary}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${chipColor}`}>
          {person.lastContactedDaysAgo === 1 ? "1d ago" : `${person.lastContactedDaysAgo}d ago`}
        </span>
      </div>

      {/* Reason */}
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-violet-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 8v4" /><path d="M12 16h.01" />
          </svg>
        </span>
        <p className="text-xs text-gray-400 leading-relaxed">{person.reason}</p>
      </div>

      {/* CTA */}
      <Link
        href={`/people/${person.id}`}
        className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/35 border border-violet-500/25 text-violet-400 text-xs font-medium transition-colors"
      >
        View profile
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

type Message =
  | { role: "user"; text: string }
  | { role: "assistant"; data: AssistantMessage };

export default function SearchPage() {
  const { session, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !session) router.push("/login");
  }, [authLoading, session, router]);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading || !session) return null;

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
        // Use recorder.mimeType — the browser's actual chosen type (may differ from requested)
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
            return; // Recording too small — skip
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
              setInput(data.text ?? "");
            }
          } catch {
            // Transcription failed silently — user can type manually
          } finally {
            setIsTranscribing(false);
          }
        };

        recorder.start(1000); // timesliced — ensures ondataavailable fires regularly
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setTimeout(drawWaveform, 50);
      } catch {
        // Microphone permission denied
      }
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setHasStarted(true);
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const res = await authedFetch(
        `${API_BASE}/tend/search/`,
        { method: "POST", body: JSON.stringify({ query: userMsg }) },
        session!.access_token,
      );

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      const results: ResultPerson[] = (data.results ?? []).map(
        (r: { contact: { id: string; name: string; notes: { text: string; date: string }[]; last_contacted_date: string }; reason: string }) => ({
          id: r.contact.id,
          name: r.contact.name,
          avatarSeed: r.contact.name,
          lastContactedDaysAgo: daysAgo(r.contact.last_contacted_date),
          summary: r.contact.notes.at(-1)?.text ?? "",
          reason: r.reason,
        })
      );

      const response: AssistantMessage =
        results.length > 0
          ? { intro: `Found ${results.length} contact${results.length === 1 ? "" : "s"} in your network:`, results }
          : { intro: "No contacts in your network matched that query. Try adding more notes!", results: [] };

      setMessages((prev) => [...prev, { role: "assistant", data: response }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", data: { intro: "Something went wrong — is the backend running?", results: [] } },
      ]);
    } finally {
      setIsLoading(false);
    }
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
        <div className="flex items-end gap-2">
          <button
            onClick={handleRecord}
            disabled={isTranscribing}
            title={isRecording ? "Stop recording" : "Start recording"}
            className={`p-1.5 rounded-lg transition-colors shrink-0 mb-0.5 ${
              isRecording
                ? "bg-red-500/15 text-red-400"
                : "text-gray-500 hover:text-violet-400 hover:bg-violet-500/10"
            }`}
          >
            <MicIcon />
          </button>
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
              isRecording ? "Listening…" : isTranscribing ? "Transcribing…" : "Ask about your relationships..."
            }
            rows={1}
            disabled={isRecording || isTranscribing}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none min-h-[24px] max-h-[120px] disabled:opacity-50"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isRecording || isTranscribing}
            className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors shrink-0 mb-0.5"
          >
            <SendIcon />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-gray-700 text-center mt-2">
        Tend AI can make mistakes. Your data stays private.
      </p>
    </div>
  );

  // Empty state
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100dvh-6rem)] md:h-[calc(100dvh-4rem)] md:-mt-8 px-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="text-xl sm:text-2xl font-light text-center h-9 mb-8">
          <TypingPrompt />
        </div>
        {inputBar}
      </div>
    );
  }

  // Conversation state
  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-4rem)]">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-2xl mx-auto py-6 flex flex-col gap-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start w-full"}`}>
              {msg.role === "user" ? (
                <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
                  <p className="text-sm text-gray-200">{msg.text}</p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-3">
                  <p className="text-xs text-gray-500 font-medium">{msg.data.intro}</p>
                  <div className="grid grid-cols-1 gap-3">
                    {msg.data.results.map((person) => (
                      <PersonCard key={person.id} person={person} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
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

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="pb-6 pt-4 px-4">
        {inputBar}
      </div>
    </div>
  );
}
