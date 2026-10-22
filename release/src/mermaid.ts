/**
 * What the generated diagrams share about Mermaid: node ids derived from
 * names, quoted labels, and the fenced block that declares the diagram's
 * name the way a hand-written block does (`%% diagram: <name>`).
 */

/**
 * The node id of `name`: each character outside `[A-Za-z0-9_]` becomes `_`
 * (`reforged-ts` is `reforged_ts`), so an id never holds the `-` of an
 * arrow and is the same on every run.
 */
export function mermaidId(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}

/**
 * The ids of `names` by name; throws when two names share an id, or one
 * takes an id of `reserved` (a subgraph's, an external node's).
 */
export function mermaidIds(
  names: Iterable<string>,
  reserved: Iterable<string> = [],
): Map<string, string> {
  const taken = new Map<string, string>(
    [...reserved].map((id) => [id, `the reserved id ${id}`]),
  );
  const ids = new Map<string, string>();
  for (const name of names) {
    const id = mermaidId(name);
    const holder = taken.get(id);
    if (holder !== undefined) {
      throw new Error(`${name} and ${holder} share the Mermaid id ${id}.`);
    }
    taken.set(id, name);
    ids.set(name, id);
  }
  return ids;
}

/** `text` as a quoted Mermaid label, its double quotes escaped. */
export function mermaidLabel(text: string): string {
  return `"${text.replaceAll('"', "#quot;")}"`;
}

/**
 * The fenced `mermaid` block of the diagram `name`: its `header` line
 * (`flowchart LR`), the declaration `%% diagram: <name>`, then `lines`,
 * each indented by two spaces.
 */
export function mermaidBlock(
  name: string,
  header: string,
  lines: readonly string[],
): string {
  const body = [`%% diagram: ${name}`, ...lines].map((line) => `  ${line}\n`);
  return `\`\`\`mermaid\n${header}\n${body.join("")}\`\`\`\n`;
}
