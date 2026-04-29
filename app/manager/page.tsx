import Link from "next/link";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { ManagerListClient } from "@/components/manager/ManagerListClient";
import { loadQuizzes } from "@/lib/load-quizzes";

export default async function ManagerPage() {
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;
  const quizzes = loadQuizzes();

  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Quiz Manager
      </h1>
      <AdminGate user={user}>
        <ManagerListClient
          committed={quizzes.map((q) => ({
            slug: q.slug,
            title: q.title,
            questionCount: q.questions.length,
            author: q.author ?? null,
          }))}
        />
      </AdminGate>
    </main>
  );
}
