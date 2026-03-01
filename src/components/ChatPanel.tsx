"use client";

import { useState } from "react";

const channels = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><circle cx="12" cy="12" r="4.5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email",
    color: "#EA4335",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
  {
    id: "phone",
    label: "SMS",
    color: "#3B82F6",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
      </svg>
    ),
  },
];

interface ChatPanelProps {
  contactName: string;
}

export default function ChatPanel({ contactName }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState("whatsapp");
  const [message, setMessage] = useState("");
  const [sentMessages, setSentMessages] = useState<
    { text: string; channel: string; time: string }[]
  >([]);

  const activeChannel = channels.find((c) => c.id === selectedChannel)!;

  const handleSend = () => {
    if (!message.trim()) return;
    setSentMessages((prev) => [
      ...prev,
      {
        text: message,
        channel: selectedChannel,
        time: new Date().toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setMessage("");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-8 bottom-8 w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-500/20 transition-colors"
        title="Open chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="w-80 shrink-0 flex flex-col bg-gray-900 border border-gray-800/60 rounded-xl overflow-hidden h-[calc(100vh-8rem)] sticky top-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-medium text-gray-200">
            Message {contactName.split(" ")[0]}
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-300"
          title="Collapse chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Channel Picker */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-800/40">
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannel(ch.id)}
            title={ch.label}
            className={`p-2 rounded-lg transition-colors ${
              selectedChannel === ch.id
                ? "bg-gray-800"
                : "hover:bg-gray-800/50"
            }`}
            style={{
              color: selectedChannel === ch.id ? ch.color : "#6b7280",
            }}
          >
            {ch.icon}
          </button>
        ))}
        <span className="ml-auto text-[11px] font-medium" style={{ color: activeChannel.color }}>
          via {activeChannel.label}
        </span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {sentMessages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-gray-600 text-center px-4">
              Send a message to {contactName.split(" ")[0]} via {activeChannel.label}
            </p>
          </div>
        )}
        {sentMessages.map((msg, i) => {
          const ch = channels.find((c) => c.id === msg.channel)!;
          return (
            <div key={i} className="flex flex-col items-end gap-1">
              <div className="bg-violet-600/20 border border-violet-500/20 rounded-xl rounded-br-sm px-3 py-2 max-w-[90%]">
                <p className="text-sm text-gray-200">{msg.text}</p>
              </div>
              <div className="flex items-center gap-1.5 px-1">
                <span style={{ color: ch.color }} className="flex items-center">
                  {ch.icon}
                </span>
                <span className="text-[10px] text-gray-600">{msg.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800/60">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Message via ${activeChannel.label}...`}
            rows={2}
            className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="p-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
