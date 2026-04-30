"use client";

import { Play, Pause } from "lucide-react";
import type { MediaBlockT } from "@/lib/quiz-schema";
import { useAudio } from "@/lib/audio/audio-context";
import { Markdown } from "./Markdown";
import { ZoomableImage } from "./ZoomableImage";
import { cn } from "@/lib/utils";

/**
 * Renders a quiz "labeled slot" — prompt, option, item, or bucket.
 *
 * A MediaBlock has optional text + optional single media (image OR audio).
 * The schema enforces "at most one media file per block" so this only ever
 * renders one of {image, audio} alongside any text.
 *
 * `size` controls how prominent the media is rendered:
 *   - `"prompt"` — full-size for the question prompt (large image, big audio bar)
 *   - `"option"` — medium for an mc option / order item / categorize item
 *   - `"chip"` — small for a categorize bucket label
 */
export function MediaBlock({
  block,
  size = "option",
  textClassName,
  inlineText = false,
}: {
  block: MediaBlockT;
  size?: "prompt" | "option" | "chip";
  textClassName?: string;
  /** When true, the text renders inline (no <p> wrapper). For chip-size labels. */
  inlineText?: boolean;
}) {
  const { text, imageSrc, audioSrc } = block;

  return (
    <div
      className={cn(
        "grid",
        size === "prompt" && "gap-3",
        size === "option" && "gap-2",
        size === "chip" && "gap-1.5",
      )}
    >
      {text && (
        <div className={textClassName}>
          <Markdown inline={inlineText}>{text}</Markdown>
        </div>
      )}
      {imageSrc && (
        <div
          className={cn(
            size === "prompt" && "max-w-md mx-auto",
            size === "option" && "max-w-[12rem]",
            size === "chip" && "max-w-[3rem]",
          )}
        >
          <ZoomableImage src={imageSrc} alt={text ?? ""} />
        </div>
      )}
      {audioSrc && <AudioClipButton src={audioSrc} size={size} />}
    </div>
  );
}

function AudioClipButton({
  src,
  size,
}: {
  src: string;
  size: "prompt" | "option" | "chip";
}) {
  const { mediaClipSrc, playMediaClip, stopMediaClip } = useAudio();
  const isThisPlaying = mediaClipSrc === src;

  function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (isThisPlaying) {
      stopMediaClip();
    } else {
      playMediaClip(src);
    }
  }

  if (size === "chip") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={isThisPlaying ? "Stop clip" : "Play clip"}
        className={cn(
          "self-start inline-flex items-center justify-center w-7 h-7 rounded-full",
          "border border-[var(--color-border-2)]",
          isThisPlaying
            ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
            : "bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)]",
        )}
      >
        {isThisPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isThisPlaying ? "Stop clip" : "Play clip"}
      className={cn(
        "inline-flex items-center gap-2 self-start",
        "px-3 py-2 rounded-full",
        "border border-[var(--color-border-2)]",
        size === "prompt" && "text-sm",
        size === "option" && "text-xs",
        isThisPlaying
          ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
          : "bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)]",
      )}
    >
      {isThisPlaying ? (
        <>
          <Pause className={size === "prompt" ? "w-4 h-4" : "w-3.5 h-3.5"} />
          <span>Pause</span>
        </>
      ) : (
        <>
          <Play className={size === "prompt" ? "w-4 h-4" : "w-3.5 h-3.5"} />
          <span>Play</span>
        </>
      )}
    </button>
  );
}

/**
 * Hidden <audio> element that plays whatever the AudioRoot's mediaClipSrc
 * is set to. Mounted once at the app root so any MediaBlock anywhere can
 * trigger playback by setting the src in context.
 */
export function MediaClipPlayer() {
  const { mediaClipSrc, stopMediaClip, settings } = useAudio();
  if (!mediaClipSrc) return null;
  return (
    <audio
      key={mediaClipSrc}
      src={mediaClipSrc}
      autoPlay
      onEnded={stopMediaClip}
      // Reuse SFX volume slider for clip volume — it sits in the same
      // mental model: "things the quiz triggers", separate from the
      // background pack music.
      // (musicVolume could also work; SFX is closer in concept.)
      // We can swap if we want a third slider.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={(el: any) => {
        if (el) el.volume = Math.max(0.1, settings.sfxVolume);
      }}
    />
  );
}
