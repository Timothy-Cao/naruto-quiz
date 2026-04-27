import fs from "node:fs";
import path from "node:path";
import { QuizSchema, type Quiz } from "@/lib/quiz-schema";

export function loadQuizzesFrom(dir: string): Quiz[] {
  const entries = fs.readdirSync(dir);
  const quizzes: Quiz[] = [];
  for (const name of entries) {
    if (!name.endsWith(".json")) continue;
    const file = path.join(dir, name);
    const raw = fs.readFileSync(file, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Failed to parse ${name}: ${(err as Error).message}`);
    }
    const result = QuizSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid quiz in ${name}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    quizzes.push(result.data);
  }
  return quizzes;
}

const DEFAULT_DIR = path.join(process.cwd(), "data", "quizzes");

export function loadQuizzes(): Quiz[] {
  return loadQuizzesFrom(DEFAULT_DIR);
}
