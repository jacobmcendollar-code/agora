export function formatJoinedMonthYear(input: string | Date | null | undefined): string | null {
  if (!input) return null;
  const date = input instanceof Date ? input : new Date(input);
  if (!Number.isNaN(date.getTime())) {
    return `Joined ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }
  if (typeof input !== "string") return null;
  const match = input.match(/^([A-Za-z]+)\s+(?:\d{1,2},?\s+)?(\d{4})$/);
  return match ? `Joined ${match[1]} ${match[2]}` : null;
}

export function timeAgo(date: string | Date): string {
  const ts = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
