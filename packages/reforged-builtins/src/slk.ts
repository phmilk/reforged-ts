/**
 * SYLK (`.slk`), the table format of the game's object data: one record per
 * line, fields separated by `;` (a doubled `;;` is a literal semicolon). A
 * `C` record sets a cell, `F` and `C` records move the current cell with
 * their `X` (column) and `Y` (row) fields, and `K` holds the value: a quoted
 * string or a bare number or boolean. Row 1 names the columns; each later
 * row is one object, keyed by its first column.
 */

/** One table: the column names of row 1, then each row by its first cell. */
export interface SlkTable {
  columns: readonly string[];
  /** Each row's cells by column name, in the order of the file. */
  rows: readonly ReadonlyMap<string, string>[];
}

/** Parses the text of an SLK file. */
export function parseSlk(text: string): SlkTable {
  const cells = new Map<number, Map<number, string>>();
  let x = 1;
  let y = 1;
  for (const line of text.split(/\r?\n/)) {
    const [type, ...fields] = splitFields(line);
    if (type !== "C" && type !== "F") continue;
    let value: string | undefined;
    for (const field of fields) {
      const code = field[0];
      const rest = field.slice(1);
      if (code === "X") x = Number(rest);
      else if (code === "Y") y = Number(rest);
      else if (code === "K" && type === "C") value = unquote(rest);
    }
    if (value === undefined) continue;
    let row = cells.get(y);
    if (row === undefined) cells.set(y, (row = new Map<number, string>()));
    row.set(x, value);
  }
  const header = cells.get(1) ?? new Map<number, string>();
  const columnAt = [...header.entries()].sort(([a], [b]) => a - b);
  const rows = [...cells.entries()]
    .filter(([index]) => index !== 1)
    .sort(([a], [b]) => a - b)
    .map(([, row]) => {
      const named = new Map<string, string>();
      for (const [index, name] of columnAt) {
        const value = row.get(index);
        if (value !== undefined) named.set(name, value);
      }
      return named;
    })
    .filter((row) => row.size > 0);
  return { columns: columnAt.map(([, name]) => name), rows };
}

/** The fields of a record, `;;` kept as a literal `;`. */
function splitFields(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char !== ";") {
      current += char;
    } else if (line[i + 1] === ";") {
      current += ";";
      i++;
    } else {
      fields.push(current);
      current = "";
    }
  }
  fields.push(current);
  return fields;
}

function unquote(value: string): string {
  return value.length >= 2 && value.startsWith('"') && value.endsWith('"')
    ? value.slice(1, -1)
    : value;
}
