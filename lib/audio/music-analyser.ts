"use client";

/**
 * Wires the music <audio> element through an AnalyserNode so the visualizer
 * can read live frequency data. createMediaElementSource may only be called
 * once per audio element, so we cache by element.
 */
const sourceMap = new WeakMap<
  HTMLAudioElement,
  { source: MediaElementAudioSourceNode; analyser: AnalyserNode }
>();

let currentAnalyser: AnalyserNode | null = null;

export function attachAnalyser(audioEl: HTMLAudioElement, ctx: AudioContext): AnalyserNode {
  let entry = sourceMap.get(audioEl);
  if (!entry) {
    const source = ctx.createMediaElementSource(audioEl);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128; // 64 frequency bins
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    entry = { source, analyser };
    sourceMap.set(audioEl, entry);
  }
  currentAnalyser = entry.analyser;
  return entry.analyser;
}

export function getMusicAnalyser(): AnalyserNode | null {
  return currentAnalyser;
}
