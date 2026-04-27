import Link from "next/link";

export default function ManagerPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <Link href="/" className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
        ← Main menu
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-text)]">
        Quiz Manager
      </h1>
      <p className="text-[var(--color-text-dim)]">Coming soon. This is where you'll edit and publish quizzes.</p>
    </main>
  );
}
