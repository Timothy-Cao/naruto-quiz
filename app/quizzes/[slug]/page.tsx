import { notFound } from "next/navigation";
import { loadQuizzes } from "@/lib/load-quizzes";
import { QuizPage } from "@/components/quiz/QuizPage";

export async function generateStaticParams() {
  return loadQuizzes().map((q) => ({ slug: q.slug }));
}

export default async function QuizRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const quiz = loadQuizzes().find((q) => q.slug === slug);
  if (!quiz) notFound();
  return <QuizPage quiz={quiz} />;
}
