"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioMatchQuestion } from "@/lib/quiz-schema";
import type { QuestionProps } from "./types";
import { cn } from "@/lib/utils";
import { Check, X, Play, Pause, RotateCcw } from "lucide-react";

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioMatchQuestionRenderer({
  question,
  state,
  onChange,
}: QuestionProps<AudioMatchQuestion, string>) {
  const locked = state.status === "confirmed";
  const selected =
    state.status === "unanswered" ? null : (state.value as string);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    function onPlay() {
      setIsPlaying(true);
    }
    function onPause() {
      setIsPlaying(false);
    }
    function onTime() {
      setCurrentTime(a!.currentTime);
    }
    function onMeta() {
      setDuration(a!.duration);
    }
    function onEnd() {
      setIsPlaying(false);
    }
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("ended", onEnd);
    };
  }, []);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }

  function restart() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const progressPct = safeDuration > 0 ? (currentTime / safeDuration) * 100 : 0;

  return (
    <div className="grid gap-4">
      {/* Audio control card */}
      <div className="rounded-lg border border-[var(--color-border-2)] bg-[var(--color-surface-2)] p-4 grid gap-3">
        <audio ref={audioRef} src={question.audioSrc} preload="metadata" />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--color-accent)] text-white shrink-0"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart"
            className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="flex-1 grid gap-1 min-w-0">
            <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-accent)] transition-[width] duration-100"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[var(--color-text-dim)] tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(safeDuration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="grid gap-2">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isCorrect = opt.id === question.correctId;
          const showCorrect = locked && isCorrect;
          const showWrong = locked && isSelected && !isCorrect;
          return (
            <button
              type="button"
              key={opt.id}
              disabled={locked}
              onClick={() => onChange(opt.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border text-left transition-colors",
                "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]",
                !locked && "hover:border-[var(--color-border-2)]",
                isSelected && !locked && "border-[var(--color-accent)] bg-[var(--color-surface-2)]",
                showCorrect && "border-[var(--color-correct)]",
                showWrong && "border-[var(--color-incorrect)]",
              )}
            >
              <span className="flex-1">{opt.label}</span>
              {showCorrect && <Check className="w-5 h-5 text-[var(--color-correct)]" />}
              {showWrong && <X className="w-5 h-5 text-[var(--color-incorrect)]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
