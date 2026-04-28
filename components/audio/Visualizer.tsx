"use client";

import { useEffect, useRef } from "react";
import { getMusicAnalyser } from "@/lib/audio/music-analyser";

const BARS = 48;

/**
 * Two thin strips on the left and right edges of the screen showing live
 * frequency bars from the music. Each bar grows inward from its wall; bar
 * widths reflect amplitude in that frequency bin.
 *
 * The bars use only the lower ~3/4 of the FFT spectrum because the very
 * top end is almost always near silent and would just look dead.
 */
export function Visualizer() {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const data = new Uint8Array(64);

    function loop() {
      const analyser = getMusicAnalyser();
      const left = leftRef.current;
      const right = rightRef.current;
      if (analyser && left && right) {
        analyser.getByteFrequencyData(data);
        const usable = Math.floor(data.length * 0.75); // skip the dead top end
        const lChildren = left.children;
        const rChildren = right.children;
        for (let i = 0; i < BARS; i++) {
          // Map bar index into the usable spectrum.
          const bin = Math.floor((i / BARS) * usable);
          const amp = data[bin] / 255;
          // Slight floor so bars don't completely vanish during quiet passages.
          const v = amp.toFixed(3);
          (lChildren[i] as HTMLElement | undefined)?.style.setProperty("--amp", v);
          (rChildren[i] as HTMLElement | undefined)?.style.setProperty("--amp", v);
        }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const bars = Array.from({ length: BARS });

  return (
    <>
      <div
        ref={leftRef}
        aria-hidden
        className="hidden md:flex pointer-events-none fixed top-0 bottom-0 left-0 w-12 lg:w-16 flex-col z-0 mix-blend-screen opacity-70"
      >
        {bars.map((_, i) => (
          <span key={i} className="viz-bar viz-bar-left" />
        ))}
      </div>
      <div
        ref={rightRef}
        aria-hidden
        className="hidden md:flex pointer-events-none fixed top-0 bottom-0 right-0 w-12 lg:w-16 flex-col z-0 mix-blend-screen opacity-70"
      >
        {bars.map((_, i) => (
          <span key={i} className="viz-bar viz-bar-right" />
        ))}
      </div>
      <style jsx>{`
        .viz-bar {
          --amp: 0;
          flex: 1;
          margin: 1px 0;
          display: block;
          will-change: width;
        }
        .viz-bar-left {
          width: calc(var(--amp) * 100%);
          background: linear-gradient(
            to right,
            var(--color-accent),
            var(--color-accent-2) 60%,
            transparent
          );
          border-top-right-radius: 2px;
          border-bottom-right-radius: 2px;
        }
        .viz-bar-right {
          margin-left: auto;
          width: calc(var(--amp) * 100%);
          background: linear-gradient(
            to left,
            var(--color-accent),
            var(--color-accent-2) 60%,
            transparent
          );
          border-top-left-radius: 2px;
          border-bottom-left-radius: 2px;
        }
      `}</style>
    </>
  );
}
