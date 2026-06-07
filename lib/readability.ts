import rs from "text-readability";

// The readability gate. All user-facing copy must score Flesch-Kincaid grade
// <= 8 (spec §3, §5.7). We use one function everywhere so the gate that runs at
// generation time and the test that guards shipped copy agree exactly.

/**
 * Flesch-Kincaid grade level for a block of text. Returns 0 for text with no
 * real words (labels like "yes"), so trivial strings never fail the gate.
 */
export function gradeText(text: string): number {
  // URLs and emails are not read aloud as words; strip them so a link does not
  // distort the reading-level score.
  const cleaned = (text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\S+@\S+\.\S+/gi, "")
    .trim();
  // Need at least one word with a vowel for the formula to mean anything.
  if (!/[a-z]/i.test(cleaned)) return 0;
  const grade = rs.fleschKincaidGrade(cleaned);
  return Number.isFinite(grade) ? grade : 0;
}

/** The highest grade across several strings — the one that could fail the gate. */
export function maxGrade(strings: Array<string | undefined | null>): number {
  let worst = 0;
  for (const s of strings) {
    if (!s) continue;
    const g = gradeText(s);
    if (g > worst) worst = g;
  }
  return worst;
}

/**
 * Grade the readable, sentence-like copy in a set of strings. We join short
 * list items into one block first, because Flesch-Kincaid is unstable on
 * isolated fragments but stable on a paragraph of them.
 */
export function gradeCopy(opts: {
  sentences?: Array<string | undefined | null>;
  itemGroups?: Array<Array<string>>;
}): number {
  const blocks: string[] = [];
  for (const s of opts.sentences ?? []) {
    if (s && s.trim()) blocks.push(s.trim());
  }
  for (const group of opts.itemGroups ?? []) {
    const joined = group
      .map((i) => i.trim())
      .filter(Boolean)
      .map((i) => (/[.!?]$/.test(i) ? i : `${i}.`))
      .join(" ");
    if (joined) blocks.push(joined);
  }
  return maxGrade(blocks);
}
