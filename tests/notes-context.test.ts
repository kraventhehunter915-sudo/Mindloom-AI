import { describe, expect, it } from "vitest";
import { extractLinks, extractTags, getPreview, getWordCount, normalizeNotes } from "../lib/notes-context";

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

  it("collapses duplicate welcome notes but preserves ordinary notes", () => {
    const base = { content: "", tags: [], folder: "Inbox", pinned: false, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
    const result = normalizeNotes([
      { ...base, id: "welcome", title: "Welcome to Mindloom AI" },
      { ...base, id: "duplicate", title: "welcome to mindloom ai" },
      { ...base, id: "ordinary", title: "My first idea" },
    ]);
    expect(result.map((note) => note.id)).toEqual(["welcome", "ordinary"]);
  });
});
