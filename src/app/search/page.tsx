"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

const hardcodedResponses: AssistantMessage[] = [
  {
    intro: "Based on your query, here are the people I found:",
    results: [
      {
        id: "contact-1",
        name: "Priya Sharma",
        avatarSeed: "Priya Sharma",
        lastContactedDaysAgo: 3,
        summary: "MBA candidate at LBS, exploring consulting and Dubai move",
        reason: "Mentioned wanting to start playing padel when you met for coffee",
      },
      {
        id: "contact-4",
        name: "Yuki Tanaka",
        avatarSeed: "Yuki Tanaka",
        lastContactedDaysAgo: 4,
        summary: "Works in product at a fintech, very into sport and fitness",
        reason: "Invited you to a padel session next week at the gym",
      },
      {
        id: "contact-7",
        name: "Carlos Rodriguez",
        avatarSeed: "Carlos Rodriguez",
        lastContactedDaysAgo: 10,
        summary: "Training for an ironman, avid padel and tennis player",
        reason: "Plays padel regularly — mentioned it over lunch last week",
      },
    ],
  },
  {
    intro: "Based on your query, here are the people I found:",
    results: [
      {
        id: "contact-7b",
        name: "Mei Liu",
        avatarSeed: "Mei Liu",
        lastContactedDaysAgo: 21,
        summary: "AI researcher at DeepMind, working on protein folding",
        reason: "Deep in AI research — great person to learn from in this space",
      },
      {
        id: "contact-2",
        name: "Marcus Williams",
        avatarSeed: "Marcus Williams",
        lastContactedDaysAgo: 2,
        summary: "Founder launching a climate tech startup, ex-McKinsey",
        reason: "Building an AI-powered climate tool — actively working with LLMs",
      },
      {
        id: "contact-3",
        name: "Felix Kumar",
        avatarSeed: "Felix Kumar",
        lastContactedDaysAgo: 3,
        summary: "Engineer and side-project enthusiast, collaborating on AI tool",
        reason: "You're already building an AI tool together — he's your go-to here",
      },
    ],
  },
  {
    intro: "Based on your query, here are the people I found:",
    results: [
      {
        id: "contact-5",
        name: "Nisha Singh",
        avatarSeed: "Nisha Singh",
        lastContactedDaysAgo: 38,
        summary: "Consultant at Bain, weighing a move into tech",
        reason: "Thinking about a career transition — a warm check-in would land well",
      },
      {
        id: "contact-6",
        name: "Omar Ahmed",
        avatarSeed: "Omar Ahmed",
        lastContactedDaysAgo: 31,
        summary: "Based in London, recently back from Tokyo",
        reason: "Back in town and looking to reconnect — suggested a group dinner",
      },
      {
        id: "contact-8",
        name: "Elena Mueller",
        avatarSeed: "Elena Mueller",
        lastContactedDaysAgo: 8,
        summary: "Fintech product lead, moving to Singapore soon",
        reason: "Haven't properly caught up since her conference talk last week",
      },
    ],
  },
];

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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIndexRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput("");
    setHasStarted(true);
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    setTimeout(() => {
      const response = hardcodedResponses[responseIndexRef.current % hardcodedResponses.length];
      responseIndexRef.current++;
      setMessages((prev) => [...prev, { role: "assistant", data: response }]);
      setIsLoading(false);
    }, 1200 + Math.random() * 800);
  };

  const inputBar = (
    <div className="max-w-2xl mx-auto w-full">
      <div className="flex items-end gap-2 bg-gray-900 border border-gray-800/60 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/15 transition-all">
        <button
          className="p-1.5 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 transition-colors shrink-0 mb-0.5"
          title="Voice input"
        >
          <MicIcon />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Ask about your relationships..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none min-h-[24px] max-h-[120px]"
          style={{ fieldSizing: "content" } as React.CSSProperties}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors shrink-0 mb-0.5"
        >
          <SendIcon />
        </button>
      </div>
      <p className="text-[10px] text-gray-700 text-center mt-2">
        Tend AI can make mistakes. Your data stays private.
      </p>
    </div>
  );

  // Empty state
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] -mt-8 px-4">
        <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div className="text-2xl font-light text-center h-9 mb-8">
          <TypingPrompt />
        </div>
        {inputBar}
      </div>
    );
  }

  // Conversation state
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto">
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
