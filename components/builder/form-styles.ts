/**
 * Shared Tailwind class strings for the builder's form inputs. Extracted to
 * avoid the same 80-character class string being copy-pasted across every form
 * file (tracked drift was already starting to accumulate).
 *
 * Three flavors:
 *   inputCls       — compact text input (used inside per-question forms)
 *   inputLargeCls  — full-width input with bigger padding (used in EditorHeader)
 *   textareaCls    — multi-line text area (prompt, explanation)
 */

export const inputCls =
  "px-2 py-1 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm";

export const inputLargeCls =
  "px-3 py-2 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm w-full";

export const textareaCls =
  "px-2 py-1.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] text-sm resize-y font-sans";
