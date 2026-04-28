"use client";

import { AudioSettingsProvider } from "@/lib/audio/audio-context";
import { MusicPlayer } from "./MusicPlayer";
import { SfxListener } from "./SfxListener";
import { SettingsButton } from "./SettingsButton";

export function AudioRoot({
  tracks,
  children,
}: {
  tracks: string[];
  children: React.ReactNode;
}) {
  return (
    <AudioSettingsProvider>
      {children}
      <MusicPlayer tracks={tracks} />
      <SfxListener />
      <SettingsButton />
    </AudioSettingsProvider>
  );
}
