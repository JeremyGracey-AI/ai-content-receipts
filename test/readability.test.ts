import { describe, it, expect } from "vitest";
import { gradeText, maxGrade, gradeCopy } from "@/lib/readability";

describe("readability helpers", () => {
  it("returns 0 for empty or word-less text", () => {
    expect(gradeText("")).toBe(0);
    expect(gradeText("   ")).toBe(0);
    expect(gradeText("123 — !!!")).toBe(0);
  });

  it("scores a plain sentence lower than a dense one", () => {
    const plain = gradeText("The dog ran to the park.");
    const dense = gradeText(
      "The exhausted canine subsequently relocated toward the recreational facility.",
    );
    expect(plain).toBeLessThan(dense);
  });

  it("ignores URLs when scoring", () => {
    const withUrl = gradeText(
      "Search it at https://lens.google.com to see more.",
    );
    const withoutUrl = gradeText("Search it at to see more.");
    expect(withUrl).toBeCloseTo(withoutUrl, 5);
  });

  it("maxGrade returns the hardest of several strings", () => {
    const worst = maxGrade([
      "The cat sat.",
      "Photosynthesis facilitates carbohydrate biosynthesis efficiently.",
    ]);
    expect(worst).toBeGreaterThan(8);
  });

  it("gradeCopy joins list items before scoring", () => {
    const grade = gradeCopy({
      sentences: ["Look at the photo."],
      itemGroups: [["Check the date", "Check the place", "Check the light"]],
    });
    expect(grade).toBeLessThanOrEqual(8);
  });
});
