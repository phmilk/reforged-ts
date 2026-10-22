/**
 * The diagrams `pnpm diagrams:generate` writes and `pnpm diagrams:check`
 * compares. A new generated diagram is a module implementing `Diagram`
 * (`diagrams.ts`), added here; the generator's core does not change.
 */
import { packagesDiagram } from "./diagram-packages.js";
import type { Diagram } from "./diagrams.js";

export const DIAGRAMS: readonly Diagram[] = [packagesDiagram];
