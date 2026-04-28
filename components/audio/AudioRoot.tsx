"use client";

import { AudioSettingsProvider } from "@/lib/audio/audio-context";
import { MusicPlayer } from "./MusicPlayer";
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
    <AudioSettingsProvider>
      <Visualizer />
      {children}
      <MusicPlayer tracks={tracks} />
      <SfxListener />
      <SettingsButton />
    </AudioSettingsProvider>
  );
}
