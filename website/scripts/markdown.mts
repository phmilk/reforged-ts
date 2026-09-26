// The Markdown text the collector reads and writes: front matter, headings,
// links and anchors. Line based and code aware: nothing inside a fenced code
// block or an inline code span is read as Markdown. Input is LF (the
// repository stores every text file with LF); normalizeNewlines covers a
// checkout that does not.

/** `text` with CRLF and lone CR line endings made LF. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** A Markdown file split into its front matter fields and its body. */
export interface FrontMatterSplit {
  /** The `key: value` lines of the front matter, values unquoted. */
  readonly fields: ReadonlyMap<string, string>;
  /** Everything after the front matter. */
  readonly body: string;
}

/**
 * Splits the YAML front matter off `text`. Only flat `key: value` lines are
 * read (what the repository's Markdown files carry); anything else in the
 * block is dropped with it.
 */
export function splitFrontMatter(text: string): FrontMatterSplit {
  const match = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(text);
  const fields = new Map<string, string>();
  if (match === null) return { fields, body: text };
  for (const line of (match[1] ?? "").split("\n")) {
    const field = /^([\w-]+):\s*(.*?)\s*$/.exec(line);
    if (field?.[1] !== undefined && field[2] !== undefined) {
      fields.set(field[1], field[2].replace(/^(["'])(.*)\1$/, "$2"));
    }
  }
  return { fields, body: text.slice(match[0].length) };
}

/** A Markdown body whose first-level heading was taken off. */
export interface Titled {
  /** The heading's text, or undefined when the body does not open on one. */
  readonly title: string | undefined;
  readonly body: string;
}

/**
 * Takes off the first-level heading `body` opens on (after blank lines), so
 * that the page's title is the only one; a body that opens on anything else
 * is returned whole.
 */
export function takeTitle(body: string): Titled {
  const match = /^\s*# +(.+?)(?: +#+)? *\n+/.exec(body + "\n");
  if (match?.[1] === undefined) return { title: undefined, body };
  return { title: match[1], body: body.slice(match[0].length) };
}

/** The text of every heading of `level` in `body`, in order. */
export function headings(body: string, level: number): string[] {
  const found: string[] = [];
  const pattern = new RegExp(`^ {0,3}#{${String(level)}} +(.+?)(?: +#+)? *$`);
  forEachLine(body, (line, inCode) => {
    const text = inCode ? undefined : pattern.exec(line)?.[1];
    if (text !== undefined) found.push(text);
  });
  return found;
}

/**
 * The anchor Docusaurus gives a heading: github-slugger's rule, which keeps
 * letters, marks, digits, `_`, `-` and spaces, then makes each space a `-`
 * (`1.0.0-alpha.0` is `100-alpha0`). Inline code marks are dropped first. A
 * repeated heading's `-1` suffix is not computed: callers link unique ones.
 */
export function headingAnchor(text: string): string {
  return text
    .replace(/`/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replace(/ /g, "-");
}

/** `text` fit for one cell of a Markdown table. */
export function tableCell(text: string): string {
  return text.replace(/\s*\n\s*/g, " ").replace(/\|/g, "\\|");
}

/**
 * `markdown` with the destination of every link and link reference
 * definition replaced by what `rewrite` returns for it (the destination
 * without its angle brackets); `undefined` keeps it. Autolinks, bare URLs,
 * footnotes and code are left alone. Code means fenced blocks and code
 * spans; neither indented code nor a fence inside a block quote is seen (no
 * collected source has one). An image is rewritten like a link: no collected
 * source has one either, and its GitHub URL would be a page, not the image.
 */
export function rewriteLinks(
  markdown: string,
  rewrite: (destination: string) => string | undefined,
): string {
  const replace = (destination: string): string => {
    const bracketed = /^<(.*)>$/.exec(destination)?.[1];
    const next = rewrite(bracketed ?? destination);
    if (next === undefined) return destination;
    return bracketed !== undefined || /[\s()]/.test(next) ? `<${next}>` : next;
  };
  return mapProse(markdown, (prose) =>
    prose
      .replace(
        /(\]\(\s*)(<[^<>\n]*>|[^\s()<>]+(?:\([^\s()]*\)[^\s()<>]*)*)/g,
        (_, open: string, destination: string) => open + replace(destination),
      )
      .replace(
        /^( {0,3}\[(?!\^)[^\]\n]+\]:[ \t]*)(<[^<>\n]*>|\S+)/gm,
        (_, open: string, destination: string) => open + replace(destination),
      ),
  );
}

/**
 * Calls `visit` on every line of `markdown`, telling it whether the line
 * belongs to a fenced code block (its fences included).
 */
function forEachLine(
  markdown: string,
  visit: (line: string, inCode: boolean) => void,
): void {
  let fence: string | undefined;
  for (const line of markdown.split("\n")) {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence === undefined) {
      if (marker !== undefined) fence = marker;
      visit(line, marker !== undefined);
      continue;
    }
    visit(line, true);
    if (
      marker?.startsWith(fence.charAt(0)) &&
      marker.length >= fence.length &&
      /^ {0,3}(`+|~+) *$/.test(line)
    ) {
      fence = undefined;
    }
  }
}

/**
 * `markdown` with `transform` applied to its prose: each run of lines outside
 * fenced code blocks, minus its inline code spans.
 */
function mapProse(
  markdown: string,
  transform: (prose: string) => string,
): string {
  const lines: string[] = [];
  let prose: string[] = [];
  const flush = () => {
    if (prose.length > 0) lines.push(mapOutsideCodeSpans(prose.join("\n")));
    prose = [];
  };
  // A code span opens on a whole backtick run and ends in its paragraph.
  const mapOutsideCodeSpans = (text: string): string =>
    text
      .split(/(\n[ \t]*\n)/)
      .map((paragraph) => {
        let result = "";
        let last = 0;
        const spans = paragraph.matchAll(
          /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g,
        );
        for (const span of spans) {
          result += transform(paragraph.slice(last, span.index)) + span[0];
          last = span.index + span[0].length;
        }
        return result + transform(paragraph.slice(last));
      })
      .join("");
  forEachLine(markdown, (line, inCode) => {
    if (!inCode) {
      prose.push(line);
      return;
    }
    flush();
    lines.push(line);
  });
  flush();
  return lines.join("\n");
}
