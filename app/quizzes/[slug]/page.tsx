import { notFound } from "next/navigation";
import { loadQuizzes } from "@/lib/load-quizzes";
import { fetchPublishedQuizServer } from "@/lib/quiz/publishing";
import { QuizPage } from "@/components/quiz/QuizPage";

// Built-in quizzes are statically rendered at build time. Community-
// published slugs fall through to a Supabase fetch at request time
// (dynamicParams = true is the App Router default).
export async function generateStaticParams() {
  return loadQuizzes().map((q) => ({ slug: q.slug }));
}

export const revalidate = 30;

export default async function QuizRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz =
    loadQuizzes().find((q) => q.slug === slug) ??
    (await fetchPublishedQuizServer(slug));
  if (!quiz) notFound();
  return <QuizPage quiz={quiz} />;
}
