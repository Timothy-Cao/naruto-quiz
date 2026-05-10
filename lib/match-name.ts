export function matchName(input: string, accepted: string[]): boolean {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length < 2) return false;
  return accepted.some((canonical) => {
    const canon = canonical.toLowerCase();
    if (canon === trimmed) return true;
    const parts = canon.split(/\s+/);
    return parts.some((part) => part === trimmed);
  });
}
