/**
 * The game's profile files (`.txt`): INI-like sections `[<Rawcode>]` of
 * `Key=Value` lines, `//` comments. A quoted value keeps what is between its
 * quotes; a value is also a list, its items split on `,` outside quotes, as
 * a field of one value per level holds them.
 *
 * As the game reads them, measured by the Probe `builtins-names` on
 * 3.0.0.24268 (run 1d12b599-e41f-482d-a4eb-e24ce230d9c9,
 * `docs/research/builtins-names.md`): keys and section names are matched
 * without regard to case (`Name` and `name` are one key, `[ANsp]` names
 * `Ansp`), and a key set twice for one Rawcode, in one file or across files
 * read in order, keeps its first value; the later one is reported. The
 * World Editor's own strings files are read with `new Profile("last")`, a
 * rule the game cannot settle (`EDITOR_STRINGS` in `generate.ts`); their
 * one section matches without regard to case too.
 */

/** A key that a later line set again, for the diagnostics. */
export interface Override {
  /** The section as the later line's header spells it. */
  section: string;
  /** The key as the later line spells it. */
  key: string;
  /** The earlier value. */
  previous: string;
  /** The later value. */
  value: string;
  /** The first items of `previous` and `value`, as a field of one value per level reads them. */
  previousFirst: string;
  valueFirst: string;
  /** The file of the later line. */
  file: string;
}

/** Which of a key's values a profile keeps when a later line sets it again. */
export type Keep = "first" | "last";

/** Each section's keys and values, merged over every file read. */
export class Profile {
  /** The value a key set twice keeps: the first, as the game's names files, by default. */
  readonly #keep: Keep;
  /** Each section's values by lower-cased key, as the line spells them, by lower-cased section. */
  readonly #sections = new Map<string, Map<string, string>>();
  readonly overrides: Override[] = [];

  constructor(keep: Keep = "first") {
    this.#keep = keep;
  }

  /** Merges the text of the profile file `file` into the profile. */
  add(text: string, file: string): void {
    let section: Map<string, string> | undefined;
    let name = "";
    for (const raw of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
      const line = raw.trim();
      if (line === "" || line.startsWith("//")) continue;
      const header = /^\[([^\]]*)\]/.exec(line);
      if (header) {
        name = header[1].trim();
        const lower = name.toLowerCase();
        section = this.#sections.get(lower);
        if (section === undefined) {
          section = new Map<string, string>();
          this.#sections.set(lower, section);
        }
        continue;
      }
      const at = line.indexOf("=");
      if (section === undefined || at === -1) continue;
      const key = line.slice(0, at).trim();
      const value = line.slice(at + 1).trim();
      const previous = section.get(key.toLowerCase());
      if (previous === undefined || this.#keep === "last") {
        section.set(key.toLowerCase(), value);
      }
      if (previous !== undefined && unquote(previous) !== unquote(value)) {
        this.overrides.push({
          section: name,
          key,
          previous: unquote(previous),
          value: unquote(value),
          previousFirst: firstItem(previous),
          valueFirst: firstItem(value),
          file,
        });
      }
    }
  }

  /** The value of `key` in section `section`, both matched without regard to case. */
  get(section: string, key: string): string | undefined {
    const value = this.#raw(section, key);
    return value === undefined ? undefined : unquote(value);
  }

  /**
   * The first item of the list `key` holds, as a field of one value per
   * level gives its first level's.
   */
  first(section: string, key: string): string | undefined {
    const value = this.#raw(section, key);
    return value === undefined ? undefined : firstItem(value);
  }

  /**
   * The list `key` holds, each item unquoted and the items joined by `,`,
   * as the World Editor names an upgrade by its names of every level.
   */
  list(section: string, key: string): string | undefined {
    const value = this.#raw(section, key);
    return value === undefined ? undefined : unquoteItems(value);
  }

  /** The value of `key` in section `section` as its line spells it, both matched without regard to case. */
  #raw(section: string, key: string): string | undefined {
    return this.#sections.get(section.toLowerCase())?.get(key.toLowerCase());
  }
}

/** The first item of a value as a line spells it: a quoted one whole, else up to the first `,`. */
function firstItem(value: string): string {
  if (value.startsWith('"')) return unquote(value);
  const comma = value.indexOf(",");
  return (comma === -1 ? value : value.slice(0, comma)).trim();
}

/** A list as a line spells it, the quotes around its items removed. */
function unquoteItems(value: string): string {
  if (!value.includes('"')) return value;
  const items: string[] = [];
  let at = 0;
  for (;;) {
    let comma: number;
    if (value[at] === '"') {
      const close = value.indexOf('"', at + 1);
      items.push(value.slice(at + 1, close === -1 ? undefined : close));
      comma = close === -1 ? -1 : value.indexOf(",", close + 1);
    } else {
      comma = value.indexOf(",", at);
      items.push(value.slice(at, comma === -1 ? undefined : comma));
    }
    if (comma === -1) return items.join(",");
    at = comma + 1;
  }
}

function unquote(value: string): string {
  if (!value.startsWith('"')) return value;
  const end = value.indexOf('"', 1);
  return end === -1 ? value.slice(1) : value.slice(1, end);
}
