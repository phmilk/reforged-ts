/**
 * The title a staged map shows in the lobby's list of maps. A map staged
 * with players goes to humans, who host it from that list (#1040), and the
 * map folder's own title is the Template's, the same as every other map
 * made from it: the step names the Probe instead, so the human picks the
 * right one. The title is `war3map.w3i`'s name field, in format 39 alone;
 * a `TRIGSTR_<n>` there names the string `n` of `war3map.wts`, which the
 * step rewrites, and a plain name is rewritten in `war3map.w3i` itself.
 */
import { AuthorError } from "./errors.js";

/** The bytes before the name: the format, the saves, the editor version and the game version's four parts. */
const NAME_OFFSET = 4 * 7;

/** The format the step reads, the World Editor of 3.0's. */
const FORMAT = 39;

/** A name field that points to a string of `war3map.wts`. */
const TRIGSTR = /^TRIGSTR_(\d+)$/;

/** The title of the Probe `probe` in the lobby's list. */
export function probeTitle(probe: string): string {
  return `Probe ${probe}`;
}

/** The name field of `w3i`: its text, and where it starts and ends. */
function nameField(w3i: Uint8Array): {
  text: string;
  start: number;
  end: number;
} {
  const view = new DataView(w3i.buffer, w3i.byteOffset, w3i.byteLength);
  if (w3i.byteLength < NAME_OFFSET || view.getInt32(0, true) !== FORMAT) {
    throw new AuthorError(
      `war3map.w3i is not of format ${String(FORMAT)}: the runner sets the title of the World Editor of 3.0's. Save the map folder with it.`,
    );
  }
  const end = w3i.indexOf(0, NAME_OFFSET);
  if (end === -1) {
    throw new AuthorError(
      "war3map.w3i ends inside its name: the file is cut short.",
    );
  }
  return {
    text: Buffer.from(w3i.subarray(NAME_OFFSET, end)).toString("utf8"),
    start: NAME_OFFSET,
    end,
  };
}

/** The string `n` of `wts` replaced by `title`; undefined when `wts` has no string `n`. */
function writeString(
  wts: string,
  n: number,
  title: string,
): string | undefined {
  const block = new RegExp(
    `(^|\\n)(\\uFEFF?STRING ${String(n)}[ \\t]*\\r?\\n(?:[^{\\n]*\\r?\\n)*?\\{\\r?\\n)[\\s\\S]*?(\\r?\\n\\})`,
  );
  if (!block.test(wts)) return undefined;
  return wts.replace(block, (_all, lead: string, head: string, tail: string) =>
    [lead, head, title, tail].join(""),
  );
}

/**
 * `w3i` and `wts` with the map's title set to `title`: the string of
 * `wts` the name field points to, or the name field itself when it holds
 * the name, or points to a string `wts` lacks. Every other byte is kept.
 */
export function writeTitle(
  w3i: Uint8Array,
  wts: string | undefined,
  title: string,
): { w3i: Uint8Array; wts: string | undefined } {
  const name = nameField(w3i);
  const pointer = TRIGSTR.exec(name.text);
  if (pointer !== null && wts !== undefined) {
    const written = writeString(wts, Number(pointer[1]), title);
    if (written !== undefined) return { w3i, wts: written };
  }
  const bytes = Buffer.from(title, "utf8");
  const copy = new Uint8Array(
    w3i.byteLength - (name.end - name.start) + bytes.byteLength,
  );
  copy.set(w3i.subarray(0, name.start), 0);
  copy.set(bytes, name.start);
  copy.set(w3i.subarray(name.end), name.start + bytes.byteLength);
  return { w3i: copy, wts };
}

/** The title of `w3i`, read through `wts` when it points to one of its strings. */
export function readTitle(w3i: Uint8Array, wts: string | undefined): string {
  const name = nameField(w3i);
  const pointer = TRIGSTR.exec(name.text);
  if (pointer === null || wts === undefined) return name.text;
  const block = new RegExp(
    `(?:^|\\n)\\uFEFF?STRING ${String(Number(pointer[1]))}[ \\t]*\\r?\\n(?:[^{\\n]*\\r?\\n)*?\\{\\r?\\n([\\s\\S]*?)\\r?\\n\\}`,
  ).exec(wts);
  return block?.[1] ?? name.text;
}
