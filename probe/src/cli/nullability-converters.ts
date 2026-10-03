/**
 * `probe:nullability-converters`: writes the converter table of the
 * Nullability sweep, `probes/nullability/converter-constants.ts`, from the
 * vendored `common.j` of the Typings' Patch and the Overlay
 * (../nullability/converters.ts). Run it after a new Patch or an Overlay
 * change of a `converter` family; a test fails until it has run. Exit
 * codes: 0 written; 1 a failure, an author error printed on one line.
 */
import fs from "node:fs";
import {
  CONVERTER_CONSTANTS_MODULE,
  OVERLAY_FOLDER,
  TYPINGS_MANIFEST,
  VENDOR_FOLDER,
} from "../folders.js";
import {
  renderConverterModule,
  type ConverterSources,
} from "../nullability/converters.js";
import {
  failure,
  invokedDirectly,
  PROCESS_OUTPUT,
  type Output,
} from "./common.js";

const USAGE = "Usage: probe:nullability-converters\n";

/** The files the command reads, and the module it writes. */
export interface Context extends ConverterSources {
  module: string;
}

export async function main(
  args: readonly string[],
  output: Output,
  context: Context = {
    manifest: TYPINGS_MANIFEST,
    vendorFolder: VENDOR_FOLDER,
    overlayFolder: OVERLAY_FOLDER,
    module: CONVERTER_CONSTANTS_MODULE,
  },
): Promise<number> {
  if (args.length !== 0) {
    output.stderr(USAGE);
    return 1;
  }
  try {
    const text = await renderConverterModule(context, context.module);
    fs.writeFileSync(context.module, text);
    output.stdout(`Wrote the converter table to ${context.module}\n`);
    return 0;
  } catch (error) {
    output.stderr(failure("probe:nullability-converters", error));
    return 1;
  }
}

if (invokedDirectly(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
