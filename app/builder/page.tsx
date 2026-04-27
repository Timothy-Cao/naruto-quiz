import Link from "next/link";

export default function BuilderPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Quiz Builder
      </h1>
      <p className="text-[var(--color-text-dim)]">Coming soon. This is where you'll create new quizzes.</p>
    </main>
  );
}
