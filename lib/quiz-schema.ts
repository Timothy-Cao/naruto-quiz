import { z } from "zod";

/**
 * Media model
 *
 * Every "labeled slot" in a quiz — the prompt of a question, every multiple-
 * choice option, every categorize item/bucket, every order item — is a
 * MediaBlock. A MediaBlock carries optional text plus AT MOST ONE local
 * media file (image OR audio, never both, no remote URLs in v1).
 *
 * The block must have at least one of {text, imageSrc, audioSrc} to be valid.
 *
 * The previous `audio-match` question type is gone — that shape is now just
 * `mc-single` with an audioSrc on the prompt MediaBlock.
 */
const MediaShape = {
  text: z.string().min(1).optional(),
  imageSrc: z.string().min(1).optional(),
  audioSrc: z.string().min(1).optional(),
};

function refineMedia<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
  return schema.superRefine((val, ctx) => {
    const v = val as { text?: string; imageSrc?: string; audioSrc?: string };
    const mediaCount = [v.imageSrc, v.audioSrc].filter(Boolean).length;
    if (mediaCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "at most one media file per block (image OR audio, not both)",
      });
    }
    if (!v.text && !v.imageSrc && !v.audioSrc) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "block must have text, imageSrc, or audioSrc",
      });
    }
  });
}

export const MediaBlock = refineMedia(z.object(MediaShape));
export type MediaBlockT = z.infer<typeof MediaBlock>;

const Option = refineMedia(
  z.object({
    id: z.string().min(1),
    ...MediaShape,
  }),
);

const CategorizeItem = refineMedia(
  z.object({
    id: z.string().min(1),
    ...MediaShape,
    correctBucketId: z.string().min(1),
  }),
);

const QuestionBase = {
  id: z.string().min(1),
  prompt: MediaBlock,
  explanation: z.string().min(1),
};

const ScoringBase = z.object({
  maxPoints: z.number().positive().optional(),
});

const ScoringWithScheme = <T extends [string, ...string[]]>(schemes: T) =>
  ScoringBase.extend({
    scheme: z.enum(schemes).optional(),
  });

const ScoringSlider = ScoringBase.extend({
  scheme: z.enum(["all-or-nothing", "tolerance"]).optional(),
  tolerance: z.number().nonnegative().optional(),
  partialCredit: z.number().min(0).max(1).optional(),
}).refine(
  (s) => {
    if (s.scheme !== "tolerance") return true;
    return typeof s.tolerance === "number" && typeof s.partialCredit === "number";
  },
  { message: "slider scoring with scheme=tolerance requires tolerance and partialCredit" },
);

const McSingle = z.object({
  ...QuestionBase,
  type: z.literal("mc-single"),
  options: z.array(Option).min(2),
  correctId: z.string().min(1),
  scoring: ScoringBase.optional(),
}).refine(
  (q) => q.options.some((o) => o.id === q.correctId),
  { message: "correctId must match one of options[].id" },
);

const McMulti = z.object({
  ...QuestionBase,
  type: z.literal("mc-multi"),
  options: z.array(Option).min(2),
  correctIds: z.array(z.string().min(1)).min(1),
  scoring: ScoringWithScheme(["all-or-nothing", "per-option"] as const).optional(),
}).refine(
  (q) => {
    const ids = new Set(q.options.map((o) => o.id));
    return q.correctIds.every((cid) => ids.has(cid));
  },
  { message: "every correctIds entry must match an option id" },
);

const Categorize = z.object({
  ...QuestionBase,
  type: z.literal("categorize"),
  buckets: z.array(Option).min(1),
  items: z.array(CategorizeItem).min(1),
  scoring: ScoringWithScheme(["all-or-nothing", "per-item"] as const).optional(),
}).refine(
  (q) => {
    const bucketIds = new Set(q.buckets.map((b) => b.id));
    return q.items.every((it) => bucketIds.has(it.correctBucketId));
  },
  { message: "every item.correctBucketId must reference a bucket id" },
);

const Order = z.object({
  ...QuestionBase,
  type: z.literal("order"),
  items: z.array(Option).min(2),
  axis: z.enum(["horizontal", "vertical"]),
  startLabel: z.string().min(1),
  endLabel: z.string().min(1),
  correctOrder: z.array(z.string().min(1)).min(2),
  scoring: ScoringWithScheme(["all-or-nothing", "per-position"] as const).optional(),
}).refine(
  (q) => q.correctOrder.length === q.items.length,
  { message: "correctOrder length must equal items length" },
).refine(
  (q) => {
    const ids = new Set(q.items.map((i) => i.id));
    return q.correctOrder.every((id) => ids.has(id));
  },
  { message: "every correctOrder id must match an item id" },
);

const Slider = z.object({
  ...QuestionBase,
  type: z.literal("slider"),
  min: z.number().int(),
  max: z.number().int(),
  step: z.number().int().positive(),
  correctValue: z.number().int(),
  scoring: ScoringSlider.optional(),
}).refine(
  (q) => q.min < q.max,
  { message: "min must be < max" },
).refine(
  (q) => q.correctValue >= q.min && q.correctValue <= q.max,
  { message: "correctValue must be within [min, max]" },
);

const Name = z.object({
  ...QuestionBase,
  type: z.literal("name"),
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  scoring: ScoringBase.optional(),
});

export const QuestionSchema = z.discriminatedUnion("type", [
  McSingle, McMulti, Categorize, Order, Slider, Name,
]);

export const QuizSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().min(1).optional(),
  author: z.string().min(1).max(120).optional(),
  questions: z.array(QuestionSchema).min(1),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type OptionT = z.infer<typeof Option>;
export type CategorizeItemT = z.infer<typeof CategorizeItem>;
export type McSingleQuestion = z.infer<typeof McSingle>;
export type McMultiQuestion = z.infer<typeof McMulti>;
export type CategorizeQuestion = z.infer<typeof Categorize>;
export type OrderQuestion = z.infer<typeof Order>;
export type SliderQuestion = z.infer<typeof Slider>;
export type NameQuestion = z.infer<typeof Name>;

/** Helper to extract the primary text of a media block, falling back to a placeholder. */
export function mediaText(m: MediaBlockT | undefined): string {
  return m?.text ?? "";
}
