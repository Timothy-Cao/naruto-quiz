import Link from "next/link";
import { loadQuizzes } from "@/lib/load-quizzes";
import { QuizListClient } from "@/components/menu/QuizListClient";

export default function QuizzesPage() {
  const quizzes = loadQuizzes();
  return (
    <main className="max-w-3xl mx-auto p-6">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)] mt-4 mb-6">
        Quizzes
      </h1>
      <QuizListClient
        quizzes={quizzes.map((q) => ({
          slug: q.slug,
          title: q.title,
          description: q.description ?? null,
          questionCount: q.questions.length,
          coverImage: q.coverImage ?? null,
          author: q.author ?? null,
        }))}
      />
    </main>
  );
}
