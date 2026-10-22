/**
 * A Markdown table as Prettier writes it, so a generated table passes
 * `prettier --check` as it is.
 */

/**
 * The table of `header` and `rows`, each column padded to its widest cell
 * (three at least, the separator's minimum), one line per row. The cells
 * are written as given: escape what Markdown would read as markup first.
 * Widths count UTF-16 units, so the text is meant to be ASCII.
 */
export function markdownTable(
  header: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const widths = header.map((cell, column) =>
    Math.max(3, cell.length, ...rows.map((row) => (row[column] ?? "").length)),
  );
  const line = (cells: readonly string[]) =>
    `| ${widths.map((width, column) => (cells[column] ?? "").padEnd(width)).join(" | ")} |\n`;
  return (
    line(header) +
    line(widths.map((width) => "-".repeat(width))) +
    rows.map(line).join("")
  );
}
