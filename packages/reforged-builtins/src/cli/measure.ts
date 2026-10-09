/**
 * `builtins:measure [--runs <n>]`: the check-time cost of the `FourCC`
 * overloads of the newest Game version (`../measure.ts`), for 100 and 1,000
 * literal calls, printed. A measurement, not a gate. A bad argument exits 2.
 */
import { gameVersionFolders } from "../check.js";
import { formatMeasurement, measure } from "../measure.js";
import {
  invokedDirectly,
  packageRoot,
  PROCESS_OUTPUT,
  type Output,
} from "./generate.js";

const USAGE = "Usage: builtins:measure [--runs <n>]\n";

export async function main(
  args: readonly string[],
  output: Output,
  root: string = packageRoot,
): Promise<number> {
  const rest = args[0] === "--" ? args.slice(1) : args;
  let runs = 7;
  if (rest.length > 0) {
    const value = Number(rest[1]);
    if (
      rest[0] !== "--runs" ||
      rest.length !== 2 ||
      !Number.isInteger(value) ||
      value < 1
    ) {
      output.stderr(USAGE);
      return 2;
    }
    runs = value;
  }
  const gameVersion = (await gameVersionFolders(root)).at(-1);
  if (gameVersion === undefined) {
    output.stderr(`${root} holds no Game version folder.\n`);
    return 1;
  }
  output.stdout(
    formatMeasurement(measure({ root, gameVersion, calls: [100, 1000], runs })),
  );
  return 0;
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
