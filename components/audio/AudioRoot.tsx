"use client";

import { AudioSettingsProvider } from "@/lib/audio/audio-context";
import { MusicPlayer } from "./MusicPlayer";
import { MusicDisclaimer } from "./MusicDisclaimer";
import { NowPlayingPill } from "./NowPlayingPill";
import { SfxListener } from "./SfxListener";
import { SettingsButton } from "./SettingsButton";
import { Visualizer } from "./Visualizer";

export function AudioRoot({
  tracks,
  children,
}: {
  tracks: string[];
  children: React.ReactNode;
}) {
  return (
    <AudioSettingsProvider tracks={tracks}>
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
