"use client";

import { AudioSettingsProvider } from "@/lib/audio/audio-context";
import { MusicPlayer } from "./MusicPlayer";
import { MusicDisclaimer } from "./MusicDisclaimer";
import { NowPlayingPill } from "./NowPlayingPill";
import { SfxListener } from "./SfxListener";
import { SettingsButton } from "./SettingsButton";
import { Visualizer } from "./Visualizer";

export function AudioRoot({
  tracksByPack,
  children,
}: {
  /** All packs' tracks indexed by pack id; built at server startup. */
  tracksByPack: Record<string, string[]>;
  children: React.ReactNode;
}) {
  return (
    <AudioSettingsProvider tracksByPack={tracksByPack}>
      <Visualizer />
      {children}
      <MusicPlayer />
      <SfxListener />
      <SettingsButton />
      <NowPlayingPill />
      <MusicDisclaimer />
    </AudioSettingsProvider>
  );
}
