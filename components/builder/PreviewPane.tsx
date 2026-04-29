"use client";
import { useState } from "react";
import type { Question } from "@/lib/quiz-schema";
import type { AnswerState } from "@/lib/player-reducer";
import type { AnswerValue } from "@/lib/scoring";
import { QuestionFrame } from "@/components/quiz/QuestionFrame";
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { scoreQuestion } from "@/lib/scoring";

type Props = {
  questions: Question[];
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
};

function fmt(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

export function PreviewPane({ questions, selectedIndex, onSelectIndex }: Props) {
  const [interactive, setInteractive] = useState(false);
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const question = questions[selectedIndex];

  // Reset preview answer when navigating between questions.
  function jump(delta: number) {
    const next = Math.min(Math.max(0, selectedIndex + delta), questions.length - 1);
    onSelectIndex(next);
    setAnswer(null);
    setConfirmed(false);
  }

  if (!question) {
    return (
      <div className="p-6 text-center text-[var(--color-text-dim)] border-l border-[var(--color-border)]">
        <p>No questions yet — add one to preview.</p>
      </div>
    );
  }

  // Compose an AnswerState for QuestionFrame.
  let state: AnswerState = { status: "unanswered" };
  if (interactive && answer !== null) {
    if (confirmed) {
      const result = scoreQuestion(question, answer);
      state = { status: "confirmed", value: answer, result, correct: result.points === result.maxPoints };
    } else {
      state = { status: "draft", value: answer };
    }
  }

  // Show example score outcomes for this question's scoring config.
  const exampleOutcomes = generateExampleOutcomes(question);

  return (
    <div className="border-l border-[var(--color-border)] flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          type="button"
          onClick={() => jump(-1)}
          disabled={selectedIndex <= 0}
          className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-[var(--color-text-dim)]">
          Preview — {selectedIndex + 1} of {questions.length}
        </span>
        <button
          type="button"
          onClick={() => jump(1)}
          disabled={selectedIndex >= questions.length - 1}
          className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setInteractive((i) => !i);
            setAnswer(null);
            setConfirmed(false);
          }}
          className="ml-auto px-2 py-1 rounded text-xs flex items-center gap-1 bg-[var(--color-surface-2)] hover:bg-[var(--color-border-2)] text-[var(--color-text)]"
        >
          {interactive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          {interactive ? "Static" : "Try interactions"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <QuestionFrame
          question={question}
          state={state}
          onChange={(v) => {
            if (interactive) setAnswer(v);
          }}
        />
        {interactive && answer !== null && !confirmed && (
          <button
            type="button"
            onClick={() => setConfirmed(true)}
            className="mt-3 px-4 py-2 rounded bg-[var(--color-accent)] text-white text-sm"
          >
            Confirm (preview)
          </button>
        )}
      </div>

      <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-xs uppercase tracking-wide text-[var(--color-text-dim)] mb-2">
          Scoring outcomes
        </p>
        <ul className="grid gap-1 text-xs">
          {exampleOutcomes.map((o, i) => (
            <li key={i} className="font-mono text-[var(--color-text-dim)]">
              <span className="text-[var(--color-text)]">{o.label}:</span> {fmt(o.points)} / {fmt(o.maxPoints)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function generateExampleOutcomes(q: Question): { label: string; points: number; maxPoints: number }[] {
  const out: { label: string; points: number; maxPoints: number }[] = [];
  switch (q.type) {
    case "mc-single": {
      out.push({ label: "Correct answer", ...scoreQuestion(q, q.correctId) });
      const wrong = q.options.find((o) => o.id !== q.correctId);
      if (wrong) out.push({ label: "Wrong answer", ...scoreQuestion(q, wrong.id) });
      break;
    }
    case "mc-multi": {
      out.push({ label: "All correct", ...scoreQuestion(q, q.correctIds) });
      out.push({ label: "Half correct picks", ...scoreQuestion(q, q.correctIds.slice(0, Math.ceil(q.correctIds.length / 2))) });
      out.push({ label: "None selected", ...scoreQuestion(q, []) });
      break;
    }
    case "categorize": {
      const allCorrect: Record<string, string> = {};
      for (const it of q.items) allCorrect[it.id] = it.correctBucketId;
      const halfCorrect: Record<string, string> = {};
      const half = Math.ceil(q.items.length / 2);
      for (let i = 0; i < q.items.length; i++) {
        if (i < half) halfCorrect[q.items[i].id] = q.items[i].correctBucketId;
      }
      out.push({ label: "All placed correctly", ...scoreQuestion(q, allCorrect) });
      out.push({ label: `${half} of ${q.items.length} correct`, ...scoreQuestion(q, halfCorrect) });
      out.push({ label: "None placed", ...scoreQuestion(q, {}) });
      break;
    }
    case "order": {
      out.push({ label: "Correct order", ...scoreQuestion(q, q.correctOrder) });
      const reversed = [...q.correctOrder].reverse();
      out.push({ label: "Reversed", ...scoreQuestion(q, reversed) });
      break;
    }
    case "slider": {
      out.push({ label: `Exact (${q.correctValue})`, ...scoreQuestion(q, q.correctValue) });
      if (q.scoring?.scheme === "tolerance") {
        const tol = q.scoring.tolerance ?? 1;
        const within = q.correctValue + tol;
        if (within <= q.max) out.push({ label: `Within tolerance (${within})`, ...scoreQuestion(q, within) });
      }
      const farOff = q.correctValue + (q.scoring?.tolerance ?? 1) + 1;
      if (farOff <= q.max) out.push({ label: `Off by ${(q.scoring?.tolerance ?? 0) + 1}`, ...scoreQuestion(q, farOff) });
      break;
    }
    case "name": {
      out.push({ label: "Correct name", ...scoreQuestion(q, q.acceptedAnswers[0]) });
      out.push({ label: "Wrong name", ...scoreQuestion(q, "Definitely Not Right") });
      break;
    }
    case "audio-match": {
      out.push({ label: "Correct option", ...scoreQuestion(q, q.correctId) });
      const wrong = q.options.find((o) => o.id !== q.correctId);
      if (wrong) out.push({ label: "Wrong option", ...scoreQuestion(q, wrong.id) });
      break;
    }
  }
  return out;
}
