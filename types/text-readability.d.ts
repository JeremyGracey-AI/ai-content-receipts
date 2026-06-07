// Minimal type declaration for text-readability (ships no types).
// We only use a few of its many scoring methods.
declare module "text-readability" {
  interface ReadabilityScores {
    fleschKincaidGrade(text: string): number;
    fleschReadingEase(text: string): number;
    syllableCount(text: string, lang?: string): number;
    lexiconCount(text: string, useCountSpaces?: boolean): number;
    sentenceCount(text: string): number;
    [key: string]: unknown;
  }
  const rs: ReadabilityScores;
  export default rs;
}
