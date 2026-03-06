/**
 * Smart date formatting for due dates.
 *
 * - "Today 5:00 PM"
 * - "Tomorrow 5:00 PM"
 * - "Tuesday 3rd March 6:00 PM"
 */
export function formatDueDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (taskDay.getTime() === today.getTime()) return `Today ${time}`;
  if (taskDay.getTime() === tomorrow.getTime()) return `Tomorrow ${time}`;

  const dayOfWeek = d.toLocaleDateString([], { weekday: "long" });
  const day = d.getDate();
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  const month = d.toLocaleDateString([], { month: "long" });

  return `${dayOfWeek} ${day}${suffix} ${month} ${time}`;
}
