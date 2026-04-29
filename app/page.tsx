import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Hammer, FolderOpen } from "lucide-react";

const cards = [
  { href: "/quizzes", title: "Quizzes", desc: "Browse quizzes and your top scores.", icon: Trophy, badge: null },
  { href: "/builder", title: "Quiz builder", desc: "Author a new quiz.", icon: Hammer, badge: "Admin" },
  { href: "/manager", title: "Quiz manager", desc: "Edit existing quizzes.", icon: FolderOpen, badge: "Admin" },
];

export default function Home() {
  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-6">
      <header className="text-center py-8">
        <h1 className="font-[family-name:var(--font-display)] text-6xl tracking-wider text-[var(--color-text)]">
          NARUTO QUIZ
        </h1>
        <p className="text-[var(--color-text-dim)] mt-2">
          Dattebayo!
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="p-5 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors h-full grid gap-2">
              <div className="flex items-center justify-between">
                <c.icon className="w-6 h-6 text-[var(--color-accent)]" />
                {c.badge && (
                  <Badge variant="outline" className="text-xs border-[var(--color-border-2)] text-[var(--color-text-dim)]">
                    {c.badge}
                  </Badge>
                )}
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)]">
                {c.title}
              </h2>
              <p className="text-sm text-[var(--color-text-dim)]">{c.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
      <footer className="text-center mt-8">
        <a
          href="https://timcao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs uppercase tracking-widest text-[var(--color-text-dim)] hover:text-[var(--color-accent)] transition-colors"
        >
          A Tim Cao Site
        </a>
      </footer>
    </main>
  );
}
