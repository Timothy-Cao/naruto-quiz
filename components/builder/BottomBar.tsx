"use client";
import { useState } from "react";
import type { ZodIssue } from "zod";
import { Check, AlertCircle, Download, Trash2 } from "lucide-react";

type Props = {
  validation: ZodIssue[];
  isDirty: boolean;
  hasDraft: boolean;
  onDownload: () => void;
  onDiscardDraft: () => void;
};

export function BottomBar({
  validation,
  isDirty,
  hasDraft,
  onDownload,
  onDiscardDraft,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const valid = validation.length === 0;

  return (
    <div className="sticky bottom-0 bg-[var(--color-bg)]/90 backdrop-blur border-t border-[var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        {valid ? (
          <span className="flex items-center gap-2 text-[var(--color-correct)] text-sm">
            <Check className="w-4 h-4" /> Valid
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-2 text-[var(--color-incorrect)] text-sm hover:underline"
          >
            <AlertCircle className="w-4 h-4" />
            {validation.length} {validation.length === 1 ? "issue" : "issues"}
          </button>
        )}
        {isDirty && (
          <span className="text-xs text-[var(--color-text-dim)]">Unsaved changes</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscardDraft}
            disabled={!hasDraft}
            className="px-3 py-2 rounded text-sm text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)] disabled:opacity-40 flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Discard draft
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!valid}
            className="px-4 py-2 rounded bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white text-sm font-medium disabled:opacity-40 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download JSON
          </button>
        </div>
      </div>

      {expanded && !valid && (
        <ul className="mt-3 text-xs grid gap-1 max-h-40 overflow-auto">
          {validation.map((issue, i) => (
            <li key={i} className="text-[var(--color-incorrect)] font-mono">
              <span className="text-[var(--color-text-dim)]">{issue.path.join(".") || "(root)"}:</span>{" "}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
