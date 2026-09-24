/** @noSelfInFile */

/**
 * How the stub call log renders a handle, `kind#id` (`timer#1048578`), for
 * the lines a test expects in `stubCalls()`.
 */
export function handleRef(kind: string, whichHandle: handle): string {
  return `${kind}#${tostring(GetHandleId(whichHandle))}`;
}
