import Link from "next/link";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { AdminGate } from "@/components/auth/AdminGate";
import { QuizEditor } from "@/components/builder/QuizEditor";

export default async function BuilderPage() {
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;

  return (
    <main className="max-w-7xl mx-auto p-4 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
        Quiz Builder
      </h1>
      <AdminGate user={user}>
        <QuizEditor />
      </AdminGate>
    </main>
  );
}
