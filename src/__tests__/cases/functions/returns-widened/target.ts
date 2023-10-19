export function getValue(): string | null {
  if (Math.random() > 0.5) {
    return "hello";
  }

  return null;
}
