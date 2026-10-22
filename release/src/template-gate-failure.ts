/**
 * How the Template gate fails, in its own steps and in the creation step
 * (`creation-step.ts`): an input it cannot work from, thrown, or a step
 * that stopped, returned.
 */
import { commandLine, type Command } from "./process.js";

/** Inputs the gate cannot work from: the pack output or the checkout. */
export class TemplateGateError extends Error {
  override name = "TemplateGateError";
}

/** Why a step failed: the command it stopped at, and the reason. */
export interface StepFailure {
  failed: string;
  message: string;
}

/** The failure of `command`, which exited with `status`. */
export function exitFailure(command: Command, status: number): StepFailure {
  return {
    failed: commandLine(command),
    message: `exit code ${String(status)}.`,
  };
}
