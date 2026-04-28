import { describe, it, expect } from "vitest";
import { pickNext, appendHistory } from "@/lib/audio/play-queue";

describe("pickNext", () => {
  it("returns null on empty list", () => {
    expect(pickNext([], [])).toBeNull();
  });

  it("returns the only track when there is one", () => {
    expect(pickNext(["a"], [])).toBe("a");
  });

  it("avoids tracks in recent history", () => {
    const tracks = ["a", "b", "c", "d", "e"];
    const history = ["a", "b", "c"];
    // random returns 0 -> picks first eligible: tracks minus history -> ["d","e"], picks "d"
    expect(pickNext(tracks, history, () => 0)).toBe("d");
    // random returns 0.99 -> picks last eligible: "e"
    expect(pickNext(tracks, history, () => 0.99)).toBe("e");
  });

  it("only considers the most recent N entries (default 5)", () => {
    const tracks = ["a", "b", "c"];
    // history longer than 5: only last 5 count → "x4","x5","x6","x7","x8" all unrelated to a/b/c
    const history = ["a", "b", "c", "x4", "x5", "x6", "x7", "x8"];
    expect(pickNext(tracks, history, () => 0)).toBe("a");
  });

  it("falls back to full list when every track is in recent history", () => {
    const tracks = ["a", "b", "c"];
    const history = ["a", "b", "c"];
    expect(["a", "b", "c"]).toContain(pickNext(tracks, history, () => 0));
  });

  it("respects custom historyMax", () => {
    const tracks = ["a", "b"];
    const history = ["a"];
    // with historyMax=0, history is ignored, full pool used
    expect(["a", "b"]).toContain(pickNext(tracks, history, () => 0, 0));
  });
});

describe("appendHistory", () => {
  it("appends and keeps under max", () => {
    expect(appendHistory(["a", "b", "c"], "d", 5)).toEqual(["a", "b", "c", "d"]);
  });

  it("evicts oldest when over max", () => {
    expect(appendHistory(["a", "b", "c", "d", "e"], "f", 5)).toEqual(["b", "c", "d", "e", "f"]);
  });

  it("respects custom max", () => {
    expect(appendHistory(["a", "b"], "c", 2)).toEqual(["b", "c"]);
  });
});
