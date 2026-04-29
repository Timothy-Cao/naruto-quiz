"use client";

import { useAudio } from "@/lib/audio/audio-context";

export function MainHeader() {
  const { activePack } = useAudio();
  return (
    <header className="text-center py-8">
      <h1 className="font-[family-name:var(--font-display)] text-6xl tracking-wider text-[var(--color-text)] uppercase">
        {activePack.displayName}
      </h1>
      <p className="text-[var(--color-text-dim)] mt-2">{activePack.subtitle}</p>
    </header>
  );
}
