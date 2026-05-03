import Link from "next/link";
import { getCurrentAuthUser, isSupabaseAuthReady } from "@/lib/auth";
import { QuizEditor } from "@/components/builder/QuizEditor";

export default async function BuilderPage() {
  // Builder is open to all visitors (signed in or not). Admin status (read
  // from Supabase if signed in) determines whether limits + restrictions apply.
  const user = isSupabaseAuthReady() ? await getCurrentAuthUser() : null;
  const isAdmin = Boolean(user?.isAdmin);
  const authorName = user?.displayName ?? user?.email ?? null;
  const publishCtx =
    user && user.email
      ? { email: user.email, displayName: user.displayName, isAdmin }
      : null;

  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 grid gap-4">
      <Link
        href="/"
        className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
      >
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-text)]">
        Quiz Builder
      </h1>
      {!isAdmin && (
        <p className="text-xs text-[var(--color-text-dim)] -mt-2">
          Community mode — up to 20 questions, text only. Sign in as the
          site admin to unlock images and longer quizzes.
        </p>
      )}
      <QuizEditor
        isAdmin={isAdmin}
        authorName={authorName}
        publishCtx={publishCtx}
      />
    </main>
  );
}
