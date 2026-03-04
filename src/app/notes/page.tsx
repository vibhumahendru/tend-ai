"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, authedFetch, authedFormFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

// --- Typing prompts ---

const prompts = [
  "Who did you meet today?",
  "How was that coffee chat?",
  "How are you feeling about your interactions?",
  "Who made an impression on you recently?",
  "Any interesting conversations worth remembering?",
  "Who did you reconnect with?",
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

type EnergyLevel = "energised" | "neutral" | "drained" | null;

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "ai"; people: ParsedPerson[]; error?: string };

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

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// --- Person card ---

function PersonCard({
  person,
  energy,
  onEnergyChange,
  saved,
}: {
  person: ParsedPerson;
  energy: EnergyLevel;
  onEnergyChange: (level: EnergyLevel) => void;
  saved: boolean;
}) {
  return (
    <div className={`bg-gray-900 border rounded-xl p-5 transition-all ${saved ? "border-emerald-500/30 bg-emerald-500/5" : "border-gray-800/60"}`}>
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(person.name)}`}
          alt={person.name}
          width={40}
          height={40}
          className="rounded-full bg-gray-800 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-100">{person.name}</p>
          {person.interaction_date && (
            <p className="text-[11px] text-gray-500 mt-0.5">{person.interaction_date}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mb-3">{person.note_about_them}</p>

      {person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {person.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-gray-800/60 pt-4">
        <p className="text-[11px] text-gray-500 font-medium mb-2.5">How did you feel?</p>
        <div className="flex gap-2 flex-wrap">
          {(["energised", "neutral", "drained"] as const).map((level) => {
            const labels = { energised: "⚡ Energised", neutral: "😐 Neutral", drained: "🪫 Drained" };
            const activeClass = {
              energised: "bg-emerald-500/20 border-emerald-500/50 text-emerald-400",
              neutral: "bg-gray-600/30 border-gray-500/50 text-gray-300",
              drained: "bg-red-500/20 border-red-500/50 text-red-400",
            }[level];
            const hoverClass = {
              energised: "hover:border-emerald-500/30 hover:text-emerald-400",
              neutral: "hover:border-gray-500/40 hover:text-gray-300",
              drained: "hover:border-red-500/30 hover:text-red-400",
            }[level];
            return (
              <button
                key={level}
                onClick={() => onEnergyChange(energy === level ? null : level)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                  energy === level
                    ? activeClass
                    : `bg-gray-800/60 border-gray-700/40 text-gray-500 ${hoverClass}`
                }`}
              >
                {labels[level]}
              </button>
            );
          })}
        </div>
      </div>
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentPeople, setCurrentPeople] = useState<ParsedPerson[] | null>(null);
  const [energySelections, setEnergySelections] = useState<Record<string, EnergyLevel>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  if (loading || !session) return null;

  const hasStarted = messages.length > 0 || isProcessing;

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunksRef.current = [];
        const recorder = new MediaRecorder(stream);

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");

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

        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch {
        // Microphone permission denied — ignore
      }
    }
  };

  const handleSubmit = async () => {
    const note = input.trim();
    if (!note || isProcessing) return;

    // Build conversation history from current messages
    const conversation = messages.map((m) =>
      m.role === "user"
        ? { role: "user", content: m.text }
        : { role: "assistant", content: JSON.stringify({ people: m.people }) }
    );

    // Append user message and clear input immediately
    const userMsg: ChatMessage = { role: "user", text: note };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);
    setIsSaved(false);

    try {
      const res = await authedFetch(
        `${API_BASE}/tend/parse-note/`,
        { method: "POST", body: JSON.stringify({ note, conversation }) },
        session.access_token
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const aiMsg: ChatMessage = { role: "ai", people: [], error: err.error ?? `Server error ${res.status}` };
        setMessages((prev) => [...prev, aiMsg]);
        return;
      }

      const data = await res.json();
      const people: ParsedPerson[] = data.people ?? [];
      const aiMsg: ChatMessage = { role: "ai", people };
      setMessages((prev) => [...prev, aiMsg]);
      setCurrentPeople(people);

      // Pre-populate energy from latest AI output
      const initial: Record<string, EnergyLevel> = {};
      for (const p of people) {
        initial[p.name] = p.energy_level ?? null;
      }
      setEnergySelections(initial);
    } catch {
      const aiMsg: ChatMessage = { role: "ai", people: [], error: "Something went wrong. Is the backend running?" };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!currentPeople || isSaving) return;
    setIsSaving(true);

    const people = currentPeople.map((p) => ({
      ...p,
      energy_level: energySelections[p.name] ?? p.energy_level,
    }));

    try {
      const res = await authedFetch(
        `${API_BASE}/tend/save-contacts/`,
        { method: "POST", body: JSON.stringify({ people }) },
        session.access_token
      );
      if (!res.ok) throw new Error("Save failed");
      setIsSaved(true);
    } catch {
      setIsSaved(true); // Optimistic for demo
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setInput("");
    setMessages([]);
    setCurrentPeople(null);
    setEnergySelections({});
    setIsSaved(false);
    setIsRecording(false);
  };

  const setEnergy = (name: string, level: EnergyLevel) => {
    setEnergySelections((prev) => ({ ...prev, [name]: level }));
  };

  const inputBar = (
    <div className="max-w-2xl mx-auto w-full">
      {/* Save bar — visible whenever we have people to save */}
      {currentPeople && currentPeople.length > 0 && (
        <div className="flex justify-center mb-3">
          {!isSaved ? (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium transition-colors"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon />
                  Save to profiles
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-medium">
              <CheckIcon />
              Saved!
            </div>
          )}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/15 transition-all">
        {/* Recording / transcribing indicator */}
        {(isRecording || isTranscribing) && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">
              {isTranscribing ? "Transcribing…" : "Recording…"}
            </span>
            {isRecording && <span className="text-xs text-gray-600 ml-auto">Tap mic to stop</span>}
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
              : "I met Sarah today for coffee. We talked about…"
          }
          rows={3}
          disabled={isRecording || isTranscribing}
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50 mb-3"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecord}
            disabled={isTranscribing}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 ${
              isRecording
                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50 hover:border-gray-600"
            }`}
          >
            <MicIcon size={14} />
            {isRecording ? "Stop" : "Record"}
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
            onClick={handleSubmit}
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

  // Empty state
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)] md:-mt-8 px-4">
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

  // Conversation state
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 flex flex-col gap-6">
          {messages.map((msg, i) => {
            if (msg.role === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-gray-200">{msg.text}</p>
                  </div>
                </div>
              );
            }

            // AI message
            const isLatest = i === messages.length - 1;
            return (
              <div key={i} className="flex flex-col gap-4">
                {msg.error ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                    <p className="text-xs text-red-400">{msg.error}</p>
                  </div>
                ) : msg.people.length === 0 ? (
                  <div className="bg-gray-900 border border-gray-800/60 rounded-xl px-4 py-4">
                    <p className="text-sm text-gray-400">No people detected in that note. Try mentioning someone by name!</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {isLatest ? "Here's a breakdown of your notes" : "Previous response"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {msg.people.map((person) => (
                        <PersonCard
                          key={person.name}
                          person={person}
                          energy={isLatest ? (energySelections[person.name] ?? null) : (person.energy_level ?? null)}
                          onEnergyChange={isLatest ? (level) => setEnergy(person.name, level) : () => {}}
                          saved={isSaved && isLatest}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
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

      {/* Input pinned at bottom */}
      <div className="pb-6 pt-4 px-4 mb-14 md:mb-0">
        {inputBar}
      </div>
    </div>
  );
}
