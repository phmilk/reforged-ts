/**
 * `studio:check-install [--install <folder>]`: finds the install as
 * `builtins:generate` does (the argument, else `WC3_EXECUTABLE`, else the
 * well-known folders), runs `checkInstall` on it and prints its report.
 * Exits 1 when the check fails or no install is found.
 */
import { openStorage } from "../casc/storage.js";
import { checkInstall } from "../check-install.js";
import {
  findInstall,
  INSTALL_OPTION,
  InstallNotFoundError,
  systemMachine,
} from "../install.js";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const at = args.indexOf(INSTALL_OPTION);
try {
  const installDir = findInstall(
    at === -1 ? undefined : args[at + 1],
    process.env.INIT_CWD ?? process.cwd(),
    systemMachine,
  );
  const result = await checkInstall(await openStorage(installDir));
  process.stdout.write(`Read the install at ${installDir}.\n${result.report}`);
  process.exitCode = result.ok ? 0 : 1;
} catch (error) {
  if (!(error instanceof InstallNotFoundError)) throw error;
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
