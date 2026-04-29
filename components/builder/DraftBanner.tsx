"use client";
import { Clock } from "lucide-react";

type Props = {
  savedAt: string;
  onUseDraft: () => void;
  onDiscard: () => void;
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - then) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

export function DraftBanner({ savedAt, onUseDraft, onDiscard }: Props) {
  return (
    <div className="p-3 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)]/10 flex items-center gap-3 mb-3">
      <Clock className="w-4 h-4 text-[var(--color-accent)] shrink-0" />
      <p className="text-sm text-[var(--color-text)] flex-1">
        Local draft from <strong>{relativeTime(savedAt)}</strong>. Use it or discard?
      </p>
      <button
        type="button"
        onClick={onUseDraft}
        className="px-3 py-1 rounded bg-[var(--color-accent)] text-white text-xs"
      >
        Use draft
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="px-3 py-1 rounded border border-[var(--color-border-2)] text-xs text-[var(--color-text)]"
      >
        Discard
      </button>
    </div>
  );
}
