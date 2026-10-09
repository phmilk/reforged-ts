/**
 * The game's profile files (`.txt`): INI-like sections `[<Rawcode>]` of
 * `Key=Value` lines, `//` comments. A quoted value keeps what is between its
 * quotes; a value is also a list, its items split on `,` outside quotes, as
 * a field of one value per level holds them. Keys are matched without regard to case (`Name` and `name` are one
 * key); section names are Rawcodes, matched exactly. A key set twice for one
 * Rawcode, in one file or across files read in order, keeps its last value,
 * and the earlier one is reported.
 */

/** A key that a later line set again, for the diagnostics. */
export interface Override {
  section: string;
  /** The key as the later line spells it. */
  key: string;
  previous: string;
  value: string;
  /** The file of the later line. */
  file: string;
}

/** Each section's keys and values, merged over every file read. */
export class Profile {
  /** Each section's values by lower-cased key, as the line spells them. */
  readonly #sections = new Map<string, Map<string, string>>();
  readonly overrides: Override[] = [];

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
        section = this.#sections.get(name);
        if (section === undefined)
          this.#sections.set(name, (section = new Map<string, string>()));
        continue;
      }
      const at = line.indexOf("=");
      if (section === undefined || at === -1) continue;
      const key = line.slice(0, at).trim();
      const value = line.slice(at + 1).trim();
      const previous = section.get(key.toLowerCase());
      if (previous !== undefined && unquote(previous) !== unquote(value)) {
        this.overrides.push({
          section: name,
          key,
          previous: unquote(previous),
          value: unquote(value),
          file,
        });
      }
      section.set(key.toLowerCase(), value);
    }
  }

  /** The value of `key` in section `section`, matched without regard to the key's case. */
  get(section: string, key: string): string | undefined {
    const value = this.#sections.get(section)?.get(key.toLowerCase());
    return value === undefined ? undefined : unquote(value);
  }

  /** The first item of the list `key` holds, as a field of one value per level gives its first level's. */
  first(section: string, key: string): string | undefined {
    const value = this.#sections.get(section)?.get(key.toLowerCase());
    if (value === undefined) return undefined;
    if (value.startsWith('"')) return unquote(value);
    const comma = value.indexOf(",");
    return (comma === -1 ? value : value.slice(0, comma)).trim();
  }
}

function unquote(value: string): string {
  if (!value.startsWith('"')) return value;
  const end = value.indexOf('"', 1);
  return end === -1 ? value.slice(1) : value.slice(1, end);
}
