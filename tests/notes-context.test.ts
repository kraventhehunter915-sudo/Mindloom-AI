import { describe, expect, it } from "vitest";
import { extractLinks, extractTags, getPreview, getWordCount } from "../lib/notes-context";

describe("note utilities", () => {
  it("extracts unique wiki links in author order", () => {
    expect(extractLinks("See [[Design system]], [[Reading list]], and [[Design system]].")).toEqual(["Design system", "Reading list"]);
  });

  it("extracts normalized hashtags without duplicates", () => {
    expect(extractTags("#Ideas are useful #ideas and #design_system")).toEqual(["ideas", "design_system"]);
  });

  it("creates a readable preview from linked markdown", () => {
    expect(getPreview("Connect [[Design system]]\n\nwith [[Reading list]].")).toBe("Connect Design system with Reading list.");
  });

  it("counts words while treating empty notes as zero", () => {
    expect(getWordCount("A quiet place for thinking")).toBe(5);
    expect(getWordCount("  \n ")).toBe(0);
  });
});
