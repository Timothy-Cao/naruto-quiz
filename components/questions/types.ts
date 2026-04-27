import type { AnswerState } from "@/lib/player-reducer";
import type { AnswerValue } from "@/lib/scoring";

export type QuestionProps<Q, V extends AnswerValue> = {
  question: Q;
  state: AnswerState;
  onChange: (value: V) => void;
};
