/**
 * The bash a workflow step's script runs in, for the tests that run one.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Git Bash's bash on Windows, beside git (`bash` there may be WSL's); bash
 * elsewhere. Undefined when Git for Windows keeps none.
 */
export function gitBash(): string | undefined {
  if (process.platform !== "win32") return "bash";
  const execPath = execFileSync("git", ["--exec-path"], {
    encoding: "utf8",
  }).trim();
  const bash = join(execPath, "..", "..", "..", "bin", "bash.exe");
  return existsSync(bash) ? bash : undefined;
}
