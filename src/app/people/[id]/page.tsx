"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getContactById } from "@/lib/dummy-contacts";
import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";
import { API_BASE, authedFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";

// --- Icons ---

function InstagramIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#F77737" />
          <stop offset="50%" stopColor="#E1306C" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" stroke="url(#ig-grad)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="url(#ig-grad)" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="#E1306C" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#EA4335">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#25D366">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

// --- Unified display type ---

interface ProfileNote {
  date: string;
  text: string;
}

interface ProfileContact {
  id: string;
  name: string;
  avatarSeed: string;
  lastContactedDaysAgo: number;
  summary: string;
  tags: string[];
  topicClusters: string[];
  suggestedOutreach: string[];
  notes: ProfileNote[];
  socials: {
    instagram?: string;
    linkedin?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
  };
}

function daysAgo(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

// Map a raw backend contact to the unified display shape
function mapBackendContact(c: {
  id: string;
  name: string;
  tags: string[];
  notes: { text: string; date: string; energy_level: string | null }[];
  last_contacted_date: string;
  created_at: string;
}): ProfileContact {
  const latestNote = c.notes.at(-1);
  return {
    id: c.id,
    name: c.name,
    avatarSeed: c.name,
    lastContactedDaysAgo: daysAgo(c.last_contacted_date),
    summary: latestNote?.text ?? "No notes yet.",
    tags: c.tags,
    topicClusters: c.tags, // use tags as topic clusters fallback
    suggestedOutreach: [
      `Send ${c.name.split(" ")[0]} a message to catch up`,
      `Share something relevant to ${c.tags[0] ?? "their interests"}`,
    ],
    notes: c.notes.map((n) => ({ date: n.date, text: n.text })),
    socials: {},
  };
}

// --- Page ---

export default function ContactDetailPage() {
  const { session, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (!authLoading && !session) router.push("/login");
  }, [authLoading, session, router]);

  const [contact, setContact] = useState<ProfileContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  const handleDelete = async () => {
    if (!session) return;
    try {
      await authedFetch(`${API_BASE}/tend/contacts/${id}/`, { method: "DELETE" }, session.access_token);
    } catch {
      // best-effort
    }
    router.push("/people");
  };

  useEffect(() => {
    if (!id || !session) return;

    // 1. Try dummy contacts first (legacy IDs like contact-1)
    const dummy = getContactById(id);
    if (dummy) {
      setContact({
        id: dummy.id,
        name: dummy.name,
        avatarSeed: dummy.avatarSeed,
        lastContactedDaysAgo: dummy.lastContactedDaysAgo,
        summary: dummy.summary,
        tags: dummy.tags,
        topicClusters: dummy.topicClusters,
        suggestedOutreach: dummy.suggestedOutreach,
        notes: dummy.notes,
        socials: dummy.socials,
      });
      setIsLoading(false);
      return;
    }

    // 2. Fetch from real backend
    authedFetch(`${API_BASE}/tend/contacts/`, {}, session.access_token)
      .then((r) => r.json())
      .then((data) => {
        const found = (data.contacts ?? []).find(
          (c: { id: string }) => c.id === id
        );
        if (found) {
          setContact(mapBackendContact(found));
        } else {
          setMissing(true);
        }
      })
      .catch(() => setMissing(true))
      .finally(() => setIsLoading(false));
  }, [id, session]);

  if (authLoading || !session) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-4 w-24 bg-gray-800 rounded" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-800 rounded" />
            <div className="h-3 w-56 bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (missing || !contact) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-gray-400 mb-4">Contact not found.</p>
        <Link href="/people" className="text-violet-400 text-sm hover:text-violet-300 transition-colors">
          ← Back to My People
        </Link>
      </div>
    );
  }

  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(contact.avatarSeed)}`;

  const summaryText =
    contact.notes.length > 0
      ? contact.notes[0].text
      : contact.summary;

  const socials = [
    { icon: <InstagramIcon />, label: "Instagram", value: contact.socials.instagram },
    { icon: <LinkedInIcon />, label: "LinkedIn", value: contact.socials.linkedin },
    { icon: <PhoneIcon />, label: "Phone", value: contact.socials.phone },
    { icon: <EmailIcon />, label: "Email", value: contact.socials.email },
    { icon: <WhatsAppIcon />, label: "WhatsApp", value: contact.socials.whatsapp },
  ];

  const hasSocials = socials.some((s) => s.value);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      <div className="flex-1 min-w-0">
        {/* Back link */}
        <Link href="/people" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6">
          <BackArrowIcon />
          Back to My People
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt={contact.name} width={64} height={64} className="rounded-full bg-gray-800" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-100">{contact.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{contact.summary}</p>
              <p className="text-xs text-gray-600 mt-1">
                Last contacted {contact.lastContactedDaysAgo === 0 ? "today" : contact.lastContactedDaysAgo === 1 ? "1 day ago" : `${contact.lastContactedDaysAgo} days ago`}
              </p>
            </div>
          </div>

          {/* Action icons — socials + trash */}
          <div className="flex items-center gap-1 flex-wrap">
            {hasSocials && socials.map((s) => s.value ? (
              <button
                key={s.label}
                title={`${s.label}: ${s.value}`}
                className="p-2.5 rounded-lg hover:bg-gray-800/60 transition-colors"
              >
                {s.icon}
              </button>
            ) : null)}
            <button
              onClick={handleDelete}
              className="p-2.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors"
              title="Delete contact"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Summary */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary</h2>
          <div className="bg-gray-900 border border-gray-800/60 rounded-xl p-4">
            <p className="text-sm text-gray-300 leading-relaxed">{summaryText}</p>
          </div>
        </section>

        {/* Tags */}
        {contact.tags.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Topic Clusters */}
        {contact.topicClusters.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Topic Clusters</h2>
            <div className="flex flex-wrap gap-2">
              {contact.topicClusters.map((topic) => (
                <span key={topic} className="px-3 py-1.5 rounded-lg bg-gray-800/80 text-gray-300 text-xs font-medium border border-gray-700/50">
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Suggested Outreach */}
        {contact.suggestedOutreach.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Suggested Outreach</h2>
            <div className="flex flex-col gap-2">
              {contact.suggestedOutreach.map((suggestion) => (
                <button
                  key={suggestion}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800/60 hover:border-violet-500/30 transition-colors text-left group"
                >
                  <span className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                    </svg>
                  </span>
                  <span className="text-sm text-gray-300">{suggestion}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Past Notes */}
        {contact.notes.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Past Mentions
              <span className="text-gray-600 font-normal ml-2">{contact.notes.length} notes</span>
            </h2>
            <div className="flex flex-col gap-3">
              {contact.notes.map((note, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800/60 rounded-xl p-4">
                  <p className="text-[11px] text-gray-600 mb-2 font-medium">{note.date}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{note.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Chat Panel */}
      <ChatPanel contactName={contact.name} />
    </div>
  );
}
