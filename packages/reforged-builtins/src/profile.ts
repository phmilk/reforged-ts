/**
 * The game's profile files (`.txt`): INI-like sections `[<Rawcode>]` of
 * `Key=Value` lines, `//` comments. A quoted value keeps what is between its
 * quotes. A key set twice for one Rawcode, in one file or across files read
 * in order, keeps its last value, and the earlier one is reported.
 */

/** A key that a later line set again, for the diagnostics. */
export interface Override {
  section: string;
  key: string;
  previous: string;
  value: string;
  /** The file of the later line. */
  file: string;
}

/** Each section's keys and values, merged over every file read. */
export class Profile {
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
      const value = unquote(line.slice(at + 1).trim());
      const previous = section.get(key);
      if (previous !== undefined && previous !== value) {
        this.overrides.push({ section: name, key, previous, value, file });
      }
      section.set(key, value);
    }
  }

  /** The value of `key` in section `section`, matched without regard to the key's case. */
  get(section: string, key: string): string | undefined {
    const values = this.#sections.get(section);
    if (values === undefined) return undefined;
    const exact = values.get(key);
    if (exact !== undefined) return exact;
    const lower = key.toLowerCase();
    for (const [name, value] of values) {
      if (name.toLowerCase() === lower) return value;
    }
    return undefined;
  }
}

function unquote(value: string): string {
  if (!value.startsWith('"')) return value;
  const end = value.indexOf('"', 1);
  return end === -1 ? value.slice(1) : value.slice(1, end);
}
