"use client";

export type SfxName = "hover" | "click" | "correct" | "wrong";

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
  }
  if (_ctx.state === "suspended") {
    _ctx.resume().catch(() => {});
  }
  return _ctx;
}

/** Public accessor for the shared AudioContext, used by the music analyser. */
export function getAudioContext(): AudioContext | null {
  return getCtx();
}

function tone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  startOffset = 0,
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = ctx.currentTime + startOffset;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
  g.gain.linearRampToValueAtTime(0, t0 + duration);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + duration + 0.05);
}

function glide(
  ctx: AudioContext,
  fromHz: number,
  toHz: number,
  duration: number,
  type: OscillatorType,
  gain: number,
) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(fromHz, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), ctx.currentTime + duration);
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
  g.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duration + 0.05);
}

export function playSfx(name: SfxName, masterVolume: number) {
  if (masterVolume <= 0) return;
  const ctx = getCtx();
  if (!ctx) return;
  try {
    switch (name) {
      case "hover":
        tone(ctx, 1200, 0.04, "sine", masterVolume * 0.12);
        break;
      case "click":
        tone(ctx, 520, 0.06, "triangle", masterVolume * 0.22);
        break;
      case "correct": {
        // Ascending arpeggio C5–E5–G5
        const v = masterVolume * 0.28;
        tone(ctx, 523.25, 0.08, "sine", v, 0);
        tone(ctx, 659.25, 0.08, "sine", v, 0.06);
        tone(ctx, 783.99, 0.16, "sine", v, 0.12);
        break;
      }
      case "wrong":
        glide(ctx, 220, 110, 0.32, "sawtooth", masterVolume * 0.22);
        break;
    }
  } catch {
    // Ignore audio errors — they shouldn't crash the app.
  }
}

/**
 * Resumes the audio context after a user gesture. Modern browsers require a
 * user gesture before any audio can start. Call this on the first interaction.
 */
export function unlockAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}
