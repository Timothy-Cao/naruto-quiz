"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  className?: string;
  thumbnailClassName?: string;
};

export function ZoomableImage({ src, alt, className, thumbnailClassName }: Props) {
  const [open, setOpen] = useState(false);
  const isExternal = src.startsWith("http");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "block overflow-hidden rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors",
          className,
        )}
        aria-label={`Zoom: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={cn("block w-full h-full object-cover", thumbnailClassName)}
          loading="lazy"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-[var(--color-bg)] border-[var(--color-border-2)]">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <img src={src} alt={alt} className="w-full h-auto rounded" />
          {isExternal && (
            <p className="text-xs text-[var(--color-text-dim)] text-center mt-2">External image</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
