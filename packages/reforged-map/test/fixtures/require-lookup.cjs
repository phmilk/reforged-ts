// A CommonJS host, as tsserver is: it loads the built package with require
// and looks one Rawcode up. Run by test/lookup.test.ts as
// `node require-lookup.cjs <package root> <map folder>`; prints JSON.

"use strict";

const process = require("node:process");

const [packageRoot, mapFolder] = process.argv.slice(2);
const { openRawcodeLookup } = require(packageRoot);

const lookup = openRawcodeLookup({ mapFolder, projectRoot: packageRoot });
const result = lookup.lookup("h000");
process.stdout.write(
  JSON.stringify({
    gameVersion: lookup.gameVersion(),
    status: result.status,
    name: result.status === "known" ? result.objects[0].name : undefined,
  }),
);
