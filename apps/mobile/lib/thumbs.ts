export function communityThumbLabel(title: string): { text: string; large: boolean } {
  const trimmed = title.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0].length <= 12) {
    return { text: words[0], large: false };
  }
  const letter = (words[0]?.[0] || trimmed[0] || "?").toUpperCase();
  return { text: letter, large: true };
}
