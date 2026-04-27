import { describe, it, expect } from "vitest";
import { matchName } from "@/lib/match-name";

describe("matchName", () => {
  it("matches case-insensitive substring", () => {
    expect(matchName("kakashi", ["Kakashi Hatake"])).toBe(true);
    expect(matchName("MINATO", ["Minato Namikaze"])).toBe(true);
  });

  it("matches exact answer", () => {
    expect(matchName("Itachi Uchiha", ["Itachi Uchiha", "Itachi"])).toBe(true);
  });

  it("trims whitespace", () => {
    expect(matchName("  itachi  ", ["Itachi Uchiha"])).toBe(true);
  });

  it("rejects empty input", () => {
    expect(matchName("", ["Itachi"])).toBe(false);
    expect(matchName("   ", ["Itachi"])).toBe(false);
  });

  it("rejects superstring of canonical", () => {
    expect(matchName("Kakashi Hatake the Sixth", ["Kakashi Hatake"])).toBe(false);
  });

  it("rejects no-match", () => {
    expect(matchName("Sasuke", ["Itachi Uchiha"])).toBe(false);
  });
});
