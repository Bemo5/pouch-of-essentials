// Display-agnostic comparison key for item-name dedup. Folds Arabic letter
// shape variants and diacritics so "لبن" added twice with subtly different
// alef forms collapses into one key. English behavior is just lowercase+trim
// with internal whitespace collapsed.
//
// Never mutates the stored or displayed name — only used for comparing.

export function normalizeName(s) {
  if (!s) return '';
  let out = String(s).normalize('NFKC');
  // Fold Alef variants → bare alef.
  out = out.replace(/[\u0622\u0623\u0625]/g, '\u0627');
  // Fold Alef Maksura → Yeh.
  out = out.replace(/\u0649/g, '\u064A');
  // Fold Teh Marbuta → Heh.
  out = out.replace(/\u0629/g, '\u0647');
  // Strip Arabic combining diacritics (fatha, damma, kasra, sukun, shadda...).
  out = out.replace(/[\u064B-\u065F\u0670]/g, '');
  // Strip tatweel.
  out = out.replace(/\u0640/g, '');
  // Collapse whitespace and lowercase.
  out = out.toLowerCase().trim().replace(/\s+/g, ' ');
  return out;
}
