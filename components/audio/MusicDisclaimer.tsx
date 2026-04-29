"use client";

/**
 * Small persistent notice in the bottom-right corner. Music tracks shipped
 * with this site are owned by their respective copyright holders; this is
 * a non-commercial fan project. Visible at all times so it can't be missed.
 */
export function MusicDisclaimer() {
  return (
    <p
      data-no-sfx
      className="hidden md:block fixed bottom-3 right-4 z-30 max-w-[14rem] text-right text-[10px] leading-snug text-[var(--color-text-dim)]/70 select-none pointer-events-none"
    >
      Music ©️ respective owners. Non-commercial fan use only.
    </p>
  );
}
