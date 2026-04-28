"use client";

import { useState } from "react";
import { Settings, Music, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAudio } from "@/lib/audio/audio-context";

export function SettingsButton() {
  const { settings, setMusicVolume, setSfxVolume } = useAudio();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Audio settings"
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 w-10 h-10 rounded-full bg-[var(--color-surface)]/80 backdrop-blur border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-dim)] hover:text-[var(--color-text)] flex items-center justify-center shadow-lg transition-colors"
      >
        <Settings className="w-5 h-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[var(--color-surface)] border-[var(--color-border-2)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--color-text)]">
            Audio
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <VolumeRow
            icon={<Music className="w-4 h-4" />}
            label="Music"
            value={settings.musicVolume}
            onChange={setMusicVolume}
          />
          <VolumeRow
            icon={<Volume2 className="w-4 h-4" />}
            label="SFX"
            value={settings.sfxVolume}
            onChange={setSfxVolume}
          />
        </div>
        <p className="text-xs text-[var(--color-text-dim)]">
          Music plays a random track from <code className="text-[var(--color-text)]">public/music/</code> and avoids the last 5 plays.
        </p>
      </DialogContent>
      </Dialog>
    </>
  );
}

function VolumeRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="grid gap-2" data-no-sfx>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[var(--color-text)]">
          <span className="text-[var(--color-text-dim)]">{icon}</span>
          {label}
        </span>
        <span className="font-mono text-[var(--color-text-dim)]">{pct}%</span>
      </div>
      <Slider
        value={[value]}
        min={0}
        max={1}
        step={0.01}
        onValueChange={(v) => {
          const n = Array.isArray(v) ? v[0] : (v as number);
          onChange(n);
        }}
      />
    </div>
  );
}
