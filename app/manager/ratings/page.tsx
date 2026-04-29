import Link from "next/link";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { loadQuizzes } from "@/lib/load-quizzes";
import { RatingsViewer } from "@/components/manager/RatingsViewer";

export default async function RatingsPage() {
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;
  const quizzes = loadQuizzes();

  return (
    <main className="max-w-5xl mx-auto p-6 grid gap-4">
      <Link
        href="/manager"
        className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
      >
        ← Manager
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Difficulty Ratings
      </h1>
      <AdminGate user={user}>
        <RatingsViewer
          quizzes={quizzes.map((q) => ({
            slug: q.slug,
            title: q.title,
            questions: q.questions.map((qq) => ({
              id: qq.id,
              prompt: qq.prompt,
              type: qq.type,
            })),
          }))}
        />
      </AdminGate>
    </main>
  );
}
