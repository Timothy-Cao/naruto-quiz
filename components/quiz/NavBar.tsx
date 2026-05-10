"use client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  canPrev: boolean;
  canConfirm: boolean;
  isConfirmed: boolean;
  isLast: boolean;
  onPrev: () => void;
  onConfirm: () => void;
  onNext: () => void;
};

export function NavBar({
  canPrev,
  canConfirm,
  isConfirmed,
  isLast,
  onPrev,
  onConfirm,
  onNext,
}: Props) {
  return (
    <div className="flex items-center justify-between mt-2">
      <Button
        variant="ghost"
        disabled={!canPrev}
        onClick={onPrev}
        className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-0"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Previous
      </Button>
      {isConfirmed ? (
        <Button
          onClick={onNext}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white px-5"
        >
          {isLast ? "See Results" : "Next"} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      ) : (
        <Button
          onClick={onConfirm}
          disabled={!canConfirm}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white px-5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm
        </Button>
      )}
    </div>
  );
}
