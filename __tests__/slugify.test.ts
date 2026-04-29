import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/builder/slugify";

describe("slugify", () => {
  it("lowercases and joins with dashes", () => {
    expect(slugify("Hidden Leaf Trivia")).toBe("hidden-leaf-trivia");
  });
  it("strips non-alphanumeric", () => {
    expect(slugify("Naruto: Shippuden #1!")).toBe("naruto-shippuden-1");
  });
  it("collapses repeated dashes", () => {
    expect(slugify("a---b   c")).toBe("a-b-c");
  });
  it("trims leading/trailing dashes", () => {
    expect(slugify(" -hello- ")).toBe("hello");
  });
  it("returns empty string on no usable chars", () => {
    expect(slugify("!!!")).toBe("");
  });
  it("handles unicode by stripping it", () => {
    expect(slugify("Tōru's Quiz")).toBe("trus-quiz");
  });
});
