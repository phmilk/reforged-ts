// A project module whose export shadows a Native's name (no-unsafe-natives).
export function PolledWait(seconds: number): void {
  print(seconds);
}
