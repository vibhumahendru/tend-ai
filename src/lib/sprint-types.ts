// Shared sprint/goal types and style maps

export interface Goal {
  id: string;
  name: string;
  description: string;
  target_count: number;
  current_count: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  week_start: string;
  week_end: string;
  status: "planning" | "active" | "completed";
  reflection: string;
  goals: Goal[];
  created_at: string;
  updated_at: string;
}

export interface SprintListItem {
  id: string;
  week_start: string;
  week_end: string;
  status: "planning" | "active" | "completed";
  goal_count: number;
  created_at: string;
  updated_at: string;
}

export const sprintStatusStyles: Record<string, string> = {
  planning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  active: "bg-green-500/15 text-green-400 border-green-500/30",
  completed: "bg-gray-600/20 text-gray-500 border-gray-600/30",
};

export const goalCategoryStyles: Record<string, string> = {
  Health: "bg-green-500/15 text-green-400 border-green-500/30",
  Work: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Growth: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Social: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  Finance: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "": "bg-gray-600/20 text-gray-500 border-gray-600/30",
};
