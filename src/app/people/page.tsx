"use client";

import { useState } from "react";
import Link from "next/link";
import { contacts, folderStructure } from "@/lib/dummy-contacts";
import type { Contact } from "@/lib/dummy-contacts";

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

  const label = days === 1 ? "1 day ago" : `${days} days ago`;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${color}`}>
      {label}
    </span>
  );
}

function ContactCard({ contact }: { contact: Contact }) {
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-100 truncate">
              {contact.name}
            </span>
          </div>
          <LastContactedChip days={contact.lastContactedDaysAgo} />
          <p className="text-xs text-gray-500 mt-2 line-clamp-1">
            {contact.summary}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function PeoplePage() {
  const [selectedFolder, setSelectedFolder] = useState("All");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["All"])
  );

  const filteredContacts = (
    selectedFolder === "All"
      ? [...contacts]
      : contacts.filter((c) => c.folder === selectedFolder)
  ).sort((a, b) => a.lastContactedDaysAgo - b.lastContactedDaysAgo);

  const toggleExpand = (folder: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-0 md:h-[calc(100vh-4rem)]">
      {/* Directory Tree — desktop only */}
      <div className="hidden md:block w-56 shrink-0 border-r border-gray-800/50 pr-4 overflow-y-auto">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
          Folders
        </h2>
        <div className="flex flex-col gap-0.5">
          {folderStructure.map((folder) => {
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
            {folderStructure.map((folder) => (
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
              {filteredContacts.length} contacts
            </span>
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredContacts.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </div>
    </div>
  );
}
