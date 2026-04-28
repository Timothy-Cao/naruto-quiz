import { z } from "zod";

const ImageRef = z.string().min(1);

const Option = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  thumbnail: ImageRef.optional(),
});

const QuestionBase = {
  id: z.string().min(1),
  prompt: z.string().min(1),
  image: ImageRef.optional(),
  explanation: z.string().min(1),
};

const McSingle = z.object({
  ...QuestionBase,
  type: z.literal("mc-single"),
  options: z.array(Option).min(2),
  correctId: z.string().min(1),
}).refine(
  (q) => q.options.some((o) => o.id === q.correctId),
  { message: "correctId must match one of options[].id" },
);

const McMulti = z.object({
  ...QuestionBase,
  type: z.literal("mc-multi"),
  options: z.array(Option).min(2),
  correctIds: z.array(z.string().min(1)).min(1),
}).refine(
  (q) => {
    const ids = new Set(q.options.map((o) => o.id));
    return q.correctIds.every((cid) => ids.has(cid));
  },
  { message: "every correctIds entry must match an option id" },
);

const CategorizeItem = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  thumbnail: ImageRef.optional(),
  correctBucketId: z.string().min(1),
});

const Categorize = z.object({
  ...QuestionBase,
  type: z.literal("categorize"),
  buckets: z.array(Option).min(1),
  items: z.array(CategorizeItem).min(1),
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
});

export const QuestionSchema = z.discriminatedUnion("type", [
  McSingle, McMulti, Categorize, Order, Slider, Name,
]);

export const QuizSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "slug must be kebab-case"),
  title: z.string().min(1),
  description: z.string().optional(),
  coverImage: ImageRef.optional(),
  questions: z.array(QuestionSchema).min(1),
});

export type Quiz = z.infer<typeof QuizSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type McSingleQuestion = z.infer<typeof McSingle>;
export type McMultiQuestion = z.infer<typeof McMulti>;
export type CategorizeQuestion = z.infer<typeof Categorize>;
export type OrderQuestion = z.infer<typeof Order>;
export type SliderQuestion = z.infer<typeof Slider>;
export type NameQuestion = z.infer<typeof Name>;
