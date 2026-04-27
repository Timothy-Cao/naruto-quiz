export function matchName(input: string, accepted: string[]): boolean {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length === 0) return false;
  return accepted.some((canonical) =>
    canonical.toLowerCase().includes(trimmed),
  );
}
