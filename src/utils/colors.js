// Warm, saturated-but-readable palette tuned to the app's cream/terracotta theme.
// All colors picked so white text at 700 weight stays legible on top.
export const PALETTE = [
  '#d2691e', // terracotta
  '#d97706', // amber
  '#ca8a04', // mustard
  '#65a30d', // olive
  '#0d9488', // teal
  '#0284c7', // sky
  '#4f46e5', // indigo
  '#7c3aed', // violet
  '#a21caf', // plum
  '#db2777', // pink
  '#e11d48', // rose
  '#b91c1c'  // brick
];

export function randomColor(exclude = []) {
  const pool = PALETTE.filter((c) => !exclude.includes(c));
  const list = pool.length ? pool : PALETTE;
  return list[Math.floor(Math.random() * list.length)];
}

// Get the first real grapheme of a string — handles Arabic, emoji, etc.
function firstChar(s) {
  if (!s) return '';
  const arr = Array.from(s);
  return arr[0] || '';
}

export function initialsOf(name) {
  if (!name) return '?';
  const cleaned = String(name).trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (firstChar(parts[0]) + firstChar(parts[1])).toUpperCase();
  }
  return firstChar(parts[0]).toUpperCase();
}
