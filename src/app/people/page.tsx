"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { folderStructure } from "@/lib/dummy-contacts";
import { API_BASE } from "@/lib/api";

// --- Backend types ---

interface BackendNote {
  text: string;
  date: string;
  energy_level: string | null;
}

interface BackendContact {
  id: string;
  name: string;
  tags: string[];
  notes: BackendNote[];
  last_contacted_date: string;
  created_at: string;
}

// --- Display type (what the card expects) ---

interface DisplayContact {
  id: string;
  name: string;
  avatarSeed: string;
  lastContactedDaysAgo: number;
  summary: string;
  folder: string;
}

function daysAgo(dateStr: string): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function mapContact(c: BackendContact): DisplayContact {
  return {
    id: c.id,
    name: c.name,
    avatarSeed: c.name,
    lastContactedDaysAgo: daysAgo(c.last_contacted_date),
    summary: c.notes.at(-1)?.text ?? "No notes yet.",
    folder: "All",
  };
}

// --- Sub-components ---

function FolderIcon({ open }: { open?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      {open ? (
        <>
          <path d="M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1" />
          <path d="M20.5 11H7.7a2 2 0 0 0-1.9 1.4L4 19h12.6a2 2 0 0 0 1.9-1.4L20.5 11z" />
        </>
      ) : (
        <>
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </>
      )}
    </svg>
  );
}

function ChevronIcon({ open }: { open?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function LastContactedChip({ days }: { days: number }) {
  let color = "bg-emerald-500/15 text-emerald-400";
  if (days > 30) color = "bg-red-500/15 text-red-400";
  else if (days > 14) color = "bg-amber-500/15 text-amber-400";

  const label = days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
      {label}
    </span>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ContactCard({
  contact,
  onDelete,
  isDeleting,
}: {
  contact: DisplayContact;
  onDelete: (id: string, e: React.MouseEvent) => void;
  isDeleting: boolean;
}) {
  const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(contact.avatarSeed)}`;

  return (
    <Link href={`/people/${contact.id}`} className="block bg-gray-900 border border-gray-800/60 rounded-xl p-4 hover:border-violet-500/30 transition-colors group cursor-pointer">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={contact.name}
          width={40}
          height={40}
          className="rounded-full bg-gray-800 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium text-gray-100 truncate">
              {contact.name}
            </span>
            {/* Delete button — hidden until card hover */}
            <button
              onClick={(e) => onDelete(contact.id, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-500/15 text-gray-600 hover:text-red-400 shrink-0"
              title="Remove contact"
            >
              {isDeleting ? <SpinnerIcon /> : <XIcon />}
            </button>
          </div>
          <LastContactedChip days={contact.lastContactedDaysAgo} />
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {contact.summary}
          </p>
        </div>
      </div>
    </Link>
  );
}

// --- Page ---

export default function PeoplePage() {
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["All"])
  );
  const [contacts, setContacts] = useState<DisplayContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/tend/contacts/`)
      .then((r) => r.json())
      .then((data) => {
        const mapped = (data.contacts ?? []).map(mapContact);
        setContacts(mapped);
        setIsLoading(false);
      })
      .catch(() => {
        setFetchError("Could not load contacts. Is the backend running?");
        setIsLoading(false);
      });
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(id);
    try {
      await fetch(`${API_BASE}/tend/contacts/${id}/`, { method: "DELETE" });
    } catch {
      // best-effort — remove from UI regardless
    }
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setDeletingId(null);
  };

  // Only "All" folder is active for real contacts
  const filteredContacts = contacts
    .filter((c) => selectedFolder === "All" || c.folder === selectedFolder)
    .sort((a, b) => a.lastContactedDaysAgo - b.lastContactedDaysAgo);

  const toggleExpand = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  // Build folder sidebar with live count for "All"
  const liveFolderStructure = folderStructure.map((f) =>
    f.name === "All" ? { ...f, count: contacts.length } : { ...f, count: 0 }
  );

  return (
    <div className="flex flex-col md:flex-row gap-0 md:h-[calc(100vh-4rem)]">
      {/* Directory Tree — desktop only */}
      <div className="hidden md:block w-56 shrink-0 border-r border-gray-800/50 pr-4 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Folders
        </h2>
        <div className="flex flex-col gap-0.5">
          {liveFolderStructure.map((folder) => {
            const isSelected = selectedFolder === folder.name;
            const isExpanded = expandedFolders.has(folder.name);
            const isAll = folder.name === "All";

            return (
              <div key={folder.name}>
                <button
                  onClick={() => {
                    setSelectedFolder(folder.name);
                    if (isAll) toggleExpand(folder.name);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    isSelected
                      ? "bg-violet-500/15 text-violet-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/40"
                  }`}
                  style={{ paddingLeft: isAll ? "8px" : "28px" }}
                >
                  {isAll && <ChevronIcon open={isExpanded} />}
                  <FolderIcon open={isSelected} />
                  <span className="truncate flex-1 text-left">{folder.name}</span>
                  <span className="text-[11px] text-gray-600 tabular-nums">
                    {folder.count}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="flex-1 overflow-y-auto md:pl-6">
        {/* Mobile folder picker */}
        <div className="md:hidden mb-4">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800/60 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-violet-500/50"
          >
            {liveFolderStructure.map((folder) => (
              <option key={folder.name} value={folder.name}>
                {folder.name} ({folder.count})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-100">
            {selectedFolder}
            <span className="text-gray-500 font-normal ml-2 text-sm">
              {isLoading ? "…" : `${filteredContacts.length} contacts`}
            </span>
          </h1>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800/60 rounded-xl p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-800 rounded w-1/4" />
                    <div className="h-3 bg-gray-800 rounded w-3/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {fetchError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400">{fetchError}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !fetchError && filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-400">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-1">No contacts yet</p>
            <p className="text-xs text-gray-600">Add a note to get started →</p>
          </div>
        )}

        {/* Contact grid */}
        {!isLoading && !fetchError && filteredContacts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onDelete={handleDelete}
                isDeleting={deletingId === contact.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
