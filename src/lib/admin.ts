export function isAdmin(username?: string | null) {
  if (!username) return false;
  const list = (process.env.ADMIN_USERNAMES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(username.toLowerCase());
}