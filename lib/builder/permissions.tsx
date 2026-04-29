"use client";

import { createContext, useContext } from "react";

/**
 * Character / count caps applied when the current viewer is NOT an admin.
 * Admin sees no maxLength and no count cap. Tuned to be generous for honest
 * use while preventing pasting a novel into an option label.
 */
export const NON_ADMIN_LIMITS = {
  // Quiz-level
  quizTitle: 80,
  quizDescription: 300,
  // Question-level
  questionPrompt: 300,
  questionExplanation: 600,
  // Choice / item / bucket labels
  optionLabel: 80,
  bucketLabel: 40,
  itemLabel: 80,
  axisLabel: 30,
  acceptedAnswer: 60,
  // Counts
  maxQuestions: 20,
} as const;

export type LimitKey = keyof typeof NON_ADMIN_LIMITS;

type PermissionsValue = {
  isAdmin: boolean;
  /**
   * Returns the maxLength to apply to a given field, or `undefined` for admin
   * (which renders the input with no limit).
   */
  limit: (key: LimitKey) => number | undefined;
};

const Ctx = createContext<PermissionsValue>({
  isAdmin: false,
  limit: (key) => NON_ADMIN_LIMITS[key],
});

export function BuilderPermissionsProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: React.ReactNode;
}) {
  const value: PermissionsValue = {
    isAdmin,
    limit: (key) => (isAdmin ? undefined : NON_ADMIN_LIMITS[key]),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePermissions(): PermissionsValue {
  return useContext(Ctx);
}
