// The parts of a Markdown file the conventions tests read: its lines, its
// headings and the lines of a section.

// The lines of a text, without the empty one after its last newline.
export function lines(text: string): string[] {
  const all = text.split(/\r?\n/);
  return all.at(-1) === "" ? all.slice(0, -1) : all;
}

// The lines of a Markdown file outside fenced code blocks, where a `#` starts
// a heading.
export function proseLines(text: string): string[] {
  let fenced = false;
  return lines(text).filter((line) => {
    if (line.startsWith("```")) fenced = !fenced;
    return !fenced;
  });
}

// The headings of one level, without their `#`s.
export function headings(text: string, level: "##" | "###"): string[] {
  const prefix = `${level} `;
  return proseLines(text)
    .filter((line) => line.startsWith(prefix))
    .map((line) => line.slice(prefix.length));
}

// The lines under a heading, up to the next heading of the same or a higher
// level; undefined when the heading is missing.
export function section(text: string, heading: string): string[] | undefined {
  const all = proseLines(text);
  const start = all.indexOf(heading);
  if (start === -1) return undefined;
  const level = heading.indexOf(" ");
  const end = all.findIndex(
    (line, i) => i > start && /^#+ /.test(line) && line.indexOf(" ") <= level,
  );
  return all.slice(start + 1, end === -1 ? undefined : end);
}
