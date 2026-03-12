// Shared task types and style maps used by tasks page + TaskDetailModal

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  urgency: "low" | "neutral" | "high";
  category: "work" | "admin" | "personal" | "ideas";
  status: "pending" | "complete";
  is_focused: boolean;
  created_at: string;
}

export type Category = "all" | "work" | "admin" | "personal" | "ideas";

export interface ParsedTask {
  title: string;
  description: string;
  due_date: string | null;
  urgency: "low" | "neutral" | "high";
  category: "work" | "admin" | "personal" | "ideas";
}

export interface SavedTask extends ParsedTask {
  id: string;
}

export type DrawerMessage =
  | { role: "user"; text: string }
  | { role: "tasks"; tasks: SavedTask[] }
  | { role: "info"; text: string };

export const urgencyStyles: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  neutral: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

export const categoryStyles: Record<string, string> = {
  work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  admin: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  personal: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ideas: "bg-violet-500/15 text-violet-400 border-violet-500/30",
};

export const categoryIcons: Record<string, string> = {
  all: "◈",
  work: "💼",
  admin: "📋",
  personal: "👤",
  ideas: "💡",
};
