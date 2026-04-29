"use client";
import type { Quiz } from "@/lib/quiz-schema";

export function downloadQuiz(quiz: Quiz): void {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(quiz, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${quiz.slug}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
