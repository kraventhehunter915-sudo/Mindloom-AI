import { describe, expect, it } from "vitest";
import { hashPassword, normalizeEmail, verifyPassword } from "../server/_core/native-auth";

describe("native account security helpers", () => {
  it("normalizes account emails", () => {
    expect(normalizeEmail("  Person@Example.COM ")).toBe("person@example.com");
  });

  it("verifies the correct password and rejects a wrong password", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", stored.hash, stored.salt)).toBe(true);
    expect(verifyPassword("not the password", stored.hash, stored.salt)).toBe(false);
  });

  it("uses a different salt for separate password records", () => {
    const first = hashPassword("same password");
    const second = hashPassword("same password");
    expect(first.salt).not.toBe(second.salt);
    expect(first.hash).not.toBe(second.hash);
  });
});
