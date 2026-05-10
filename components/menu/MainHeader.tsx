"use client";

import { useAudio } from "@/lib/audio/audio-context";

export function MainHeader() {
  const { activePack } = useAudio();
  return (
    <header className="text-center py-10 sm:py-14">
      <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-6xl tracking-wider text-[var(--color-text)] uppercase leading-none">
        {activePack.displayName}
      </h1>
      <p className="text-sm text-[var(--color-text-dim)] mt-3 italic tracking-wide">
        {activePack.subtitle}
      </p>
    </header>
  );
}
