/** @noSelfInFile */

// Where a creation error points. Lua prefixes an error message with the
// `file:line:` of the frame the error level names; the library aims that at
// the Map project's line that called the creation member. `raisedIn` checks
// the aim: it runs `call`, and only when the error's position lies inside
// `call` itself does it return the bare message, so a test compares that.
// An error that points anywhere else comes back with its position, and one
// with no position at all (a level that names a C frame such as `pcall`)
// comes back marked `(no position)`; both fail the comparison.
//
// `call` must make the creation call as a statement, not return it:
// `() => { Timer.create(); }`. A returned call is a Lua tail call, which
// drops `call`'s frame, so the position would name the frame below it.
//
// It reads the position of `call` through the `debug` library, which the
// harness's Lua has and the game's does not: test code only.

/**
 * The message of the error `call` raised: bare when the error's position is
 * inside `call`; with its `file:line: ` prefix when it points elsewhere;
 * prefixed `(no position) ` when it has none; `"(no error)"` when `call`
 * returned.
 */
export function raisedIn(call: () => void): string {
  const [ok, raised] = pcall(call);
  if (ok) {
    return "(no error)";
  }
  const message = tostring(raised);
  // string.match returns nil for every capture when the message has no
  // position, whatever its declared type says.
  const captures: LuaMultiReturn<(string | undefined)[]> = string.match(
    message,
    "^(.-):(%d+): (.*)$",
  );
  const [file, line, rest] = captures;
  if (file === undefined || line === undefined || rest === undefined) {
    return `(no position) ${message}`;
  }
  const site = debug.getinfo(call, "S");
  const at = tonumber(line) ?? 0;
  const inside =
    file === site.short_src &&
    at >= (site.linedefined ?? Infinity) &&
    at <= (site.lastlinedefined ?? -Infinity);
  return inside ? rest : message;
}
