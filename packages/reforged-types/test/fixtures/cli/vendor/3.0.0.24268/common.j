// A small Patch for the typings:generate script test.
type agent extends handle
type player extends agent
type unit extends agent

native CreateUnit takes player id, integer unitid, real x, real y, real face returns unit
