import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { QuizEditor } from "@/components/builder/QuizEditor";
import { loadQuizzes } from "@/lib/load-quizzes";

export async function generateStaticParams() {
  return loadQuizzes().map((q) => ({ slug: q.slug }));
}

export default async function ManagerEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;
  const authorName = user?.displayName ?? user?.email ?? null;
  const quiz = loadQuizzes().find((q) => q.slug === slug);
  if (!quiz) notFound();

  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 grid gap-4">
      <Link href="/manager" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Manager
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
        Editing: {quiz.title}
      </h1>
      <AdminGate user={user}>
        <QuizEditor initialQuiz={quiz} authorName={authorName} />
      </AdminGate>
    </main>
  );
}
