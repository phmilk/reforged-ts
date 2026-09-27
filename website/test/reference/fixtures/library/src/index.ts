/**
 * Greets a player by name.
 * @example
 * {@includeCode ../examples/greeting.ts#greet}
 * @native DisplayTextToPlayer
 * @param name - The player's name.
 * @returns The greeting.
 */
export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function undocumentedFarewell(name: string): string {
  return `Goodbye, ${name}!`;
}

/**
 * Welcomes every player.
 * @example
 * {@includeCode ../examples/welcome.ts}
 * @param names - The players' names.
 * @returns One greeting per player.
 */
export function welcome(names: readonly string[]): string[] {
  return names.map(greet);
}
