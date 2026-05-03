import Link from "next/link";
import { loadQuizzes } from "@/lib/load-quizzes";
import { listPublishedQuizzesServer } from "@/lib/quiz/publishing";
import { QuizListClient } from "@/components/menu/QuizListClient";

// Lists merge: built-in quizzes (data/quizzes/*.json) + community-published
// quizzes from Supabase. Built-in slugs win on conflict.
export const revalidate = 30;

export default async function QuizzesPage() {
  const builtIn = loadQuizzes();
  const published = await listPublishedQuizzesServer();

  const builtInItems = builtIn.map((q) => ({
    slug: q.slug,
    title: q.title,
    description: q.description ?? null,
    questionCount: q.questions.length,
    coverImage: q.coverImage ?? null,
    author: q.author ?? null,
    isCommunity: false,
  }));

  const seen = new Set(builtInItems.map((q) => q.slug));
  const publishedItems = published
    .filter((p) => !seen.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      questionCount: p.questionCount,
      coverImage: p.coverImage,
      author: p.author,
      isCommunity: true,
    }));

  const items = [...builtInItems, ...publishedItems];

  return (
    <main className="max-w-3xl mx-auto p-3 sm:p-4 lg:p-6 min-w-0">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--color-text)] mt-4 mb-6 break-words">
        Quizzes
      </h1>
      <QuizListClient quizzes={items} />
    </main>
  );
}
