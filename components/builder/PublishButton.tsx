"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Check, Loader2, AlertCircle, Eye } from "lucide-react";
import type { Quiz } from "@/lib/quiz-schema";
import {
  publishQuiz,
  getMyPublishedQuizzes,
  type PublishContext,
} from "@/lib/quiz/publishing-client";

type Props = {
  quiz: Quiz;
  valid: boolean;
  publishCtx: PublishContext | null;
};

type Status =
  | { kind: "idle" }
  | { kind: "publishing" }
  | { kind: "success"; slug: string; replaced: boolean }
  | { kind: "error"; message: string };

export function PublishButton({ quiz, valid, publishCtx }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [existingSlug, setExistingSlug] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // For non-admins, look up whether they already have a published quiz so
  // we can warn that publishing a different slug will replace it.
  useEffect(() => {
    if (!publishCtx || publishCtx.isAdmin) {
      setExistingSlug(null);
      return;
    }
    let cancelled = false;
    getMyPublishedQuizzes(publishCtx.email).then((rows) => {
      if (cancelled) return;
      setExistingSlug(rows[0]?.slug ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [publishCtx]);

  if (!publishCtx) {
    return (
      <div className="text-xs text-[var(--color-text-dim)]">
        Sign in to publish
      </div>
    );
  }

  const willReplace =
    !publishCtx.isAdmin &&
    existingSlug !== null &&
    existingSlug !== quiz.slug;

  async function doPublish() {
    if (!publishCtx) return;
    setStatus({ kind: "publishing" });
    const result = await publishQuiz(quiz, publishCtx);
    if (result.ok) {
      setStatus({ kind: "success", slug: result.slug, replaced: willReplace });
      setConfirming(false);
      setExistingSlug(result.slug);
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  }

  function onClick() {
    if (status.kind === "publishing") return;
    if (willReplace && !confirming) {
      setConfirming(true);
      return;
    }
    doPublish();
  }

  const label =
    status.kind === "publishing"
      ? "Publishing…"
      : confirming
        ? `Replace existing "${existingSlug}"?`
        : existingSlug === quiz.slug
          ? "Republish"
          : "Publish";

  const Icon =
    status.kind === "publishing"
      ? Loader2
      : status.kind === "success"
        ? Check
        : status.kind === "error"
          ? AlertCircle
          : Upload;

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onClick}
        disabled={!valid || status.kind === "publishing"}
        className="px-4 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm font-medium disabled:opacity-40 flex items-center gap-2"
      >
        <Icon
          className={`w-4 h-4 ${status.kind === "publishing" ? "animate-spin" : ""}`}
        />
        {label}
      </button>
      {status.kind === "success" && (
        <Link
          href={`/quizzes/${status.slug}`}
          className="text-xs text-[var(--color-correct)] flex items-center gap-1 hover:underline"
        >
          <Eye className="w-3 h-3" />
          {status.replaced ? "Replaced — view live" : "Published — view live"}
        </Link>
      )}
      {status.kind === "error" && (
        <span className="text-xs text-[var(--color-incorrect)]">
          {status.message}
        </span>
      )}
      {!publishCtx.isAdmin && existingSlug && status.kind !== "success" && (
        <span className="text-xs text-[var(--color-text-dim)]">
          Currently published: <code>{existingSlug}</code>
        </span>
      )}
    </div>
  );
}
