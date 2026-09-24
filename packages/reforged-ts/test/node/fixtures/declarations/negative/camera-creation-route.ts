// The creation route Camera's accessors use is package-internal: the
// library's entry file does not export it.
import { expectWrapper } from "reforged-ts"; // error TS2305

export { expectWrapper };
