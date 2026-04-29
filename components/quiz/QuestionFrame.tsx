"use client";
import type { Question } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import type { AnswerValue } from "@/lib/scoring";
import { Card } from "@/components/ui/card";
import { ZoomableImage } from "./ZoomableImage";
import { Markdown } from "./Markdown";
import { RevealPanel } from "./RevealPanel";
import { McSingleQuestionRenderer } from "@/components/questions/McSingleQuestion";
import { McMultiQuestionRenderer } from "@/components/questions/McMultiQuestion";
import { CategorizeQuestionRenderer } from "@/components/questions/CategorizeQuestion";
import { OrderQuestionRenderer } from "@/components/questions/OrderQuestion";
import { SliderQuestionRenderer } from "@/components/questions/SliderQuestion";
import { NameQuestionRenderer } from "@/components/questions/NameQuestion";

type Props = {
  question: Question;
  state: AnswerState;
  onChange: (value: AnswerValue) => void;
};

export function QuestionFrame({ question, state, onChange }: Props) {
  return (
    <Card className="p-6 bg-[var(--color-surface)] border-[var(--color-border)] overflow-visible">
      <div className="text-xl font-medium text-[var(--color-text)] mb-4">
        <Markdown>{question.prompt}</Markdown>
      </div>
      {question.image && (
        <div className="mb-4 max-w-md mx-auto">
          <ZoomableImage src={question.image} alt={question.prompt} />
        </div>
      )}
      <Renderer question={question} state={state} onChange={onChange} />
      {state.status === "confirmed" && (
        <RevealPanel result={state.result} explanation={question.explanation} />
      )}
    </Card>
  );
}

function Renderer({ question, state, onChange }: Props) {
  switch (question.type) {
    case "mc-single":
      return <McSingleQuestionRenderer question={question} state={state} onChange={onChange as (v: string) => void} />;
    case "mc-multi":
      return <McMultiQuestionRenderer question={question} state={state} onChange={onChange as (v: string[]) => void} />;
    case "categorize":
      return <CategorizeQuestionRenderer question={question} state={state} onChange={onChange as (v: Record<string, string>) => void} />;
    case "order":
      return <OrderQuestionRenderer question={question} state={state} onChange={onChange as (v: string[]) => void} />;
    case "slider":
      return <SliderQuestionRenderer question={question} state={state} onChange={onChange as (v: number) => void} />;
    case "name":
      return <NameQuestionRenderer question={question} state={state} onChange={onChange as (v: string) => void} />;
  }
}
