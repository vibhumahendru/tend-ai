"use client";

import { useState, useEffect, useRef } from "react";

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

// --- Hardcoded AI parse result for demo ---

interface ParsedPerson {
  name: string;
  summary: string;
  tags: string[];
}

const demoParseResults: ParsedPerson[] = [
  {
    name: "Ash Scott",
    summary: "Met for morning coffee. Discussed AI and learning to play chess. Energetic conversation.",
    tags: ["AI", "chess", "coffee chat"],
  },
  {
    name: "Kartik Mehta",
    summary: "Evening catch-up. Starting a new venture in solar energy. Has a friend who can connect me to someone at Google DeepMind.",
    tags: ["solar", "venture", "DeepMind", "introduction"],
  },
];

type EnergyLevel = "energised" | "neutral" | "drained" | null;

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

function MicOffIcon({ size = 20 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
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

// --- Component ---

export default function NotesPage() {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResults, setParseResults] = useState<ParsedPerson[] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [energySelections, setEnergySelections] = useState<Record<string, EnergyLevel>>({});

  const handleRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setInput(
        "I met Ash today in the morning for coffee, we spoke about AI, we spoke about learning how to play chess. In the evening, I met Kartik, who is a relative, and he told me how he's starting a new venture in the solar space and he also mentioned that he has a friend who can connect me to someone at Google DeepMind."
      );
    } else {
      setIsRecording(true);
      setInput("");
      setParseResults(null);
      setIsSaved(false);
    }
  };

  const handleSubmit = () => {
    if (!input.trim() || isProcessing) return;
    setHasStarted(true);
    setIsProcessing(true);
    setParseResults(null);
    setIsSaved(false);
    setEnergySelections({});

    setTimeout(() => {
      setParseResults(demoParseResults);
      setIsProcessing(false);
    }, 1500);
  };

  const handleSave = () => {
    setIsSaved(true);
  };

  const handleReset = () => {
    setInput("");
    setParseResults(null);
    setIsSaved(false);
    setIsRecording(false);
    setHasStarted(false);
    setEnergySelections({});
  };

  const setEnergy = (name: string, level: EnergyLevel) => {
    setEnergySelections((prev) => ({
      ...prev,
      [name]: prev[name] === level ? null : level,
    }));
  };

  const inputBar = (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-gray-900 border border-gray-800/60 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/15 transition-all">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-medium">Recording...</span>
            <span className="text-xs text-gray-600 ml-auto">Tap mic to stop</span>
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
          placeholder={isRecording ? "Listening..." : "I met Sarah today for coffee. We talked about..."}
          rows={3}
          disabled={isRecording}
          className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none disabled:opacity-50 mb-3"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={handleRecord}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isRecording
                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                : "bg-gray-800 text-gray-400 hover:text-gray-200 border border-gray-700/50 hover:border-gray-600"
            }`}
          >
            {isRecording ? <MicOffIcon size={14} /> : <MicIcon size={14} />}
            {isRecording ? "Stop" : "Record"}
          </button>

          <div className="flex-1" />

          {(input || parseResults) && !isSaved && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing || isRecording}
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

  // Empty state — centered
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

  // Active state — content + input pinned at bottom
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 flex flex-col gap-6">

          {/* User's note bubble */}
          <div className="flex justify-end">
            <div className="bg-violet-600/20 border border-violet-500/20 rounded-2xl rounded-br-sm px-4 py-3 max-w-[80%]">
              <p className="text-sm text-gray-200">{input}</p>
            </div>
          </div>

          {/* Processing dots */}
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

          {/* Parse results */}
          {parseResults && (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Here&apos;s a breakdown of your notes
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parseResults.map((person) => {
                  const energy = energySelections[person.name] ?? null;
                  return (
                    <div
                      key={person.name}
                      className={`bg-gray-900 border rounded-xl p-5 transition-all ${
                        isSaved
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-gray-800/60"
                      }`}
                    >
                      {/* Avatar + Name */}
                      <div className="flex items-center gap-3 mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(person.name)}`}
                          alt={person.name}
                          width={36}
                          height={36}
                          className="rounded-full bg-gray-800"
                        />
                        <span className="text-sm font-semibold text-gray-100">{person.name}</span>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-gray-400 leading-relaxed mb-3">
                        {person.summary}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {person.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Energy selector */}
                      <div className="border-t border-gray-800/60 pt-4">
                        <p className="text-[11px] text-gray-500 font-medium mb-2.5">How did you feel?</p>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setEnergy(person.name, "energised")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                              energy === "energised"
                                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                                : "bg-gray-800/60 border-gray-700/40 text-gray-500 hover:border-emerald-500/30 hover:text-emerald-400"
                            }`}
                          >
                            <span>⚡</span>
                            Energised
                          </button>

                          <button
                            onClick={() => setEnergy(person.name, "neutral")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                              energy === "neutral"
                                ? "bg-gray-600/30 border-gray-500/50 text-gray-300"
                                : "bg-gray-800/60 border-gray-700/40 text-gray-500 hover:border-gray-500/40 hover:text-gray-300"
                            }`}
                          >
                            <span>😐</span>
                            Neutral
                          </button>

                          <button
                            onClick={() => setEnergy(person.name, "drained")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                              energy === "drained"
                                ? "bg-red-500/20 border-red-500/50 text-red-400"
                                : "bg-gray-800/60 border-gray-700/40 text-gray-500 hover:border-red-500/30 hover:text-red-400"
                            }`}
                          >
                            <span>🪫</span>
                            Drained
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save button — below cards */}
              <div className="flex justify-center pt-2">
                {!isSaved ? (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                  >
                    <CheckIcon />
                    Save to profiles
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-medium">
                    <CheckIcon />
                    Saved!
                  </div>
                )}
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
