"use client";
import { useState } from "react";
import type { MediaBlockT } from "@/lib/quiz-schema";
import { Image as ImageIcon, Music, X } from "lucide-react";
import { textareaCls, inputCls } from "./form-styles";
import { usePermissions } from "@/lib/builder/permissions";
import { cn } from "@/lib/utils";

/**
 * Inline editor for a MediaBlock — text + at most one media (image or audio).
 *
 * Shows a textarea + a small chip menu to attach an image path or audio path.
 * When something is attached, the path becomes editable inline with a remove
 * button. Schema enforces "at most one media", so the buttons hide once the
 * other type is in use.
 *
 * Per-author limits: non-admins can edit text but the image/audio buttons
 * are hidden. (Admins only for media in v1.)
 */
export function MediaBlockEditor({
  block,
  onChange,
  textRows = 2,
  textPlaceholder = "Type here…",
  textMaxLength,
  compact = false,
  /** When true, the text field is optional (e.g., for an option that's audio-only). */
  textOptional = false,
}: {
  block: MediaBlockT;
  onChange: (next: MediaBlockT) => void;
  textRows?: number;
  textPlaceholder?: string;
  textMaxLength?: number;
  compact?: boolean;
  textOptional?: boolean;
}) {
  const { isAdmin } = usePermissions();
  const [expandedField, setExpandedField] = useState<"image" | "audio" | null>(
    block.imageSrc ? "image" : block.audioSrc ? "audio" : null,
  );

  function setText(text: string) {
    const next: MediaBlockT = { ...block, text: text || undefined };
    if (!next.text && !next.imageSrc && !next.audioSrc) {
      // Block must have at least one of {text, imageSrc, audioSrc} — preserve text empty for typing.
      onChange({ ...block, text: text || undefined });
      return;
    }
    onChange(next);
  }

  function setImage(imageSrc: string) {
    onChange({ ...block, imageSrc: imageSrc || undefined, audioSrc: undefined });
  }

  function setAudio(audioSrc: string) {
    onChange({ ...block, audioSrc: audioSrc || undefined, imageSrc: undefined });
  }

  function removeMedia() {
    onChange({ ...block, imageSrc: undefined, audioSrc: undefined });
    setExpandedField(null);
  }

  const hasImage = Boolean(block.imageSrc);
  const hasAudio = Boolean(block.audioSrc);
  const showImageBtn = isAdmin && !hasAudio && !hasImage;
  const showAudioBtn = isAdmin && !hasAudio && !hasImage;

  return (
    <div className="grid gap-1.5">
      <textarea
        value={block.text ?? ""}
        onChange={(e) => setText(e.target.value)}
        rows={textRows}
        maxLength={textMaxLength}
        placeholder={textOptional ? `${textPlaceholder} (optional)` : textPlaceholder}
        className={cn(textareaCls, compact ? "text-xs" : "text-sm", "w-full")}
      />
      {(hasImage || hasAudio || expandedField) && (
        <div className="flex items-center gap-2">
          {(hasImage || expandedField === "image") && (
            <div className="flex-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
              <input
                type="text"
                value={block.imageSrc ?? ""}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/images/foo.png"
                className={cn(inputCls, "flex-1")}
              />
              <button
                type="button"
                onClick={removeMedia}
                className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)]"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {(hasAudio || expandedField === "audio") && (
            <div className="flex-1 flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-[var(--color-text-dim)] shrink-0" />
              <input
                type="text"
                value={block.audioSrc ?? ""}
                onChange={(e) => setAudio(e.target.value)}
                placeholder="/music/naruto-ost/Foo.mp3"
                className={cn(inputCls, "flex-1")}
              />
              <button
                type="button"
                onClick={removeMedia}
                className="p-1 rounded text-[var(--color-text-dim)] hover:text-[var(--color-incorrect)]"
                aria-label="Remove audio"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
      {(showImageBtn || showAudioBtn) && (
        <div className="flex items-center gap-1">
          {showImageBtn && (
            <button
              type="button"
              onClick={() => setExpandedField("image")}
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-[var(--color-border-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3" /> Add image
            </button>
          )}
          {showAudioBtn && (
            <button
              type="button"
              onClick={() => setExpandedField("audio")}
              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border border-[var(--color-border-2)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:border-[var(--color-accent)] flex items-center gap-1"
            >
              <Music className="w-3 h-3" /> Add audio
            </button>
          )}
        </div>
      )}
    </div>
  );
}
