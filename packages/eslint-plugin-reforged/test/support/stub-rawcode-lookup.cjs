// A module loaded instead of reforged-map (the plugin option
// files.rawcodeLookup), for the cases the real lookup cannot show: its
// `openRawcodeLookup` answers through `globalThis.reforgedStubLookup`, which
// a test sets to a function from the Rawcode to the result, or to one that
// throws.
"use strict";

exports.openRawcodeLookup = () => ({
  lookup: (rawcode) => globalThis.reforgedStubLookup(rawcode),
  gameVersion: () => "3.0.0",
  warnings: () => [],
});
