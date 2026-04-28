"use client";

import { useEffect, useRef } from "react";
import { useAudio } from "@/lib/audio/audio-context";

const TRIGGER_SELECTOR = 'button, a[href], [role="button"]';

function isInteractive(el: Element | null): boolean {
  if (!el) return false;
  if (el.hasAttribute("disabled")) return false;
  // Walk up the tree to see if anything wants to opt out.
  let cur: Element | null = el;
  while (cur) {
    if (cur.hasAttribute && cur.hasAttribute("data-no-sfx")) return false;
    cur = cur.parentElement;
  }
  return true;
}

export function SfxListener() {
  const { playSfx } = useAudio();
  const lastHoverTargetRef = useRef<Element | null>(null);

  useEffect(() => {
    function onPointerOver(e: PointerEvent) {
      const target = e.target as Element | null;
      const trigger = target?.closest(TRIGGER_SELECTOR) ?? null;
      if (!trigger) {
        lastHoverTargetRef.current = null;
        return;
      }
      if (trigger === lastHoverTargetRef.current) return;
      if (!isInteractive(trigger)) {
        lastHoverTargetRef.current = trigger;
        return;
      }
      lastHoverTargetRef.current = trigger;
      playSfx("hover");
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Element | null;
      const trigger = target?.closest(TRIGGER_SELECTOR) ?? null;
      if (!trigger) return;
      if (!isInteractive(trigger)) return;
      playSfx("click");
    }

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [playSfx]);

  return null;
}
