import { describe, it, expect } from "vitest";
import { matchName } from "@/lib/match-name";

describe("matchName", () => {
  it("matches first or last name (word-level)", () => {
    expect(matchName("kakashi", ["Kakashi Hatake"])).toBe(true);
    expect(matchName("MINATO", ["Minato Namikaze"])).toBe(true);
    expect(matchName("Hatake", ["Kakashi Hatake"])).toBe(true);
  });

  it("matches exact full answer", () => {
    expect(matchName("Itachi Uchiha", ["Itachi Uchiha", "Itachi"])).toBe(true);
  });

  it("trims whitespace", () => {
    expect(matchName("  itachi  ", ["Itachi Uchiha"])).toBe(true);
  });

  it("rejects empty or single-char input", () => {
    expect(matchName("", ["Itachi"])).toBe(false);
    expect(matchName("   ", ["Itachi"])).toBe(false);
    expect(matchName("a", ["Naruto"])).toBe(false);
    expect(matchName("I", ["Itachi"])).toBe(false);
  });

  it("rejects partial substrings that are not full words", () => {
    expect(matchName("ashi", ["Kakashi Hatake"])).toBe(false);
    expect(matchName("nar", ["Naruto"])).toBe(false);
  });

  it("rejects superstring of canonical", () => {
    expect(matchName("Kakashi Hatake the Sixth", ["Kakashi Hatake"])).toBe(false);
  });

  it("rejects no-match", () => {
    expect(matchName("Sasuke", ["Itachi Uchiha"])).toBe(false);
  });
});
