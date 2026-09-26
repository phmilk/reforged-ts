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
