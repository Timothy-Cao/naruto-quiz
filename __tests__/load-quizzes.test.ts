import { describe, it, expect } from "vitest";
import { loadQuizzesFrom } from "@/lib/load-quizzes";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

function makeFixtureDir(files: Record<string, unknown>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-fixture-"));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), JSON.stringify(content));
  }
  return dir;
}

const validQuiz = {
  slug: "x",
  title: "X",
  questions: [{
    id: "q1", type: "mc-single", prompt: "p", explanation: "e",
    options: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
    correctId: "a",
  }],
};

describe("loadQuizzesFrom", () => {
  it("loads and validates JSON files", () => {
    const dir = makeFixtureDir({ "x.json": validQuiz });
    expect(loadQuizzesFrom(dir)).toHaveLength(1);
  });

  it("throws on invalid quiz with file path in error", () => {
    const bad = { ...validQuiz, slug: "BAD SLUG" };
    const dir = makeFixtureDir({ "bad.json": bad });
    expect(() => loadQuizzesFrom(dir)).toThrow(/bad\.json/);
  });

  it("ignores non-json files and .gitkeep", () => {
    const dir = makeFixtureDir({ "x.json": validQuiz });
    fs.writeFileSync(path.join(dir, ".gitkeep"), "");
    fs.writeFileSync(path.join(dir, "README.md"), "# notes");
    expect(loadQuizzesFrom(dir)).toHaveLength(1);
  });
});
