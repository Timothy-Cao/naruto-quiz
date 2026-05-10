import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Hammer, FolderOpen } from "lucide-react";
import { MainHeader } from "@/components/menu/MainHeader";
import { UnderConstructionBanner } from "@/components/UnderConstructionBanner";

const cards = [
  { href: "/quizzes", title: "Quizzes", desc: "Browse quizzes and your top scores.", icon: Trophy, badge: null },
  { href: "/builder", title: "Quiz builder", desc: "Author a new quiz.", icon: Hammer, badge: "Admin" },
  { href: "/manager", title: "Quiz manager", desc: "Edit existing quizzes.", icon: FolderOpen, badge: "Admin" },
];

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-5 py-10 grid gap-8">
      <MainHeader />
      <UnderConstructionBanner />
      <nav className="grid gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="group p-5 bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/60 transition-all duration-200 h-full grid gap-3 hover:shadow-lg hover:shadow-[var(--color-accent)]/5">
              <div className="flex items-center justify-between">
                <c.icon className="w-5 h-5 text-[var(--color-accent)] opacity-80 group-hover:opacity-100 transition-opacity" />
                {c.badge && (
                  <Badge variant="outline" className="text-[10px] border-[var(--color-border-2)] text-[var(--color-text-dim)]">
                    {c.badge}
                  </Badge>
                )}
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-text)] leading-tight">
                {c.title}
              </h2>
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">{c.desc}</p>
            </Card>
          </Link>
        ))}
      </nav>
      <footer className="text-center pt-4">
        <a
          href="https://timcao.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shimmer-link text-xs uppercase tracking-[0.2em]"
        >
          A Tim Cao Site
        </a>
      </footer>
    </main>
  );
}
