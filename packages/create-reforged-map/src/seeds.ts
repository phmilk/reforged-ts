/**
 * Preparing the Seeds of a new Map project for their new owner: the project
 * name and the description of the map written into `package.json`, the
 * README and `AGENTS.md`, each at an anchor the Template keeps. A missing
 * anchor throws, naming it, rather than writing in the wrong place; the text
 * between the Template's sync markers is never written.
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

/** The project's identity, which its Seeds are prepared with. */
export interface ProjectIdentity {
  /** The project name: `package.json`'s `name` and the README's title. */
  name: string;
  /**
   * A one-line description of the map: `package.json`'s `description`, a
   * paragraph under the README's title and the body of `AGENTS.md`'s "Your
   * project". `undefined` keeps the Template's text.
   */
  description: string | undefined;
}

/** The heading of `AGENTS.md` whose body becomes the description. */
export const YOUR_PROJECT = "## Your project";

/** A Seed, from its text and the project's identity, to its prepared text. */
type Prepare = (text: string, project: ProjectIdentity) => string;

const DOCUMENTS: readonly (readonly [file: string, prepare: Prepare])[] = [
  ["package.json", preparedManifest],
  ["README.md", preparedReadme],
  ["AGENTS.md", preparedAgents],
];

const SYNC_MARKER = /^\s*<!-- reforged-ts:[\w-]+:(start|end) -->\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Prepares the Seeds of the Template written into `folder`. Every document
 * is read and prepared before the first is written, so a missing anchor
 * throws with nothing changed.
 */
export async function prepareSeeds(
  folder: string,
  project: ProjectIdentity,
): Promise<void> {
  const prepared: [path: string, text: string][] = [];
  for (const [file, prepare] of DOCUMENTS) {
    const path = join(folder, file);
    const text = await readFile(path, "utf8").catch((error: unknown) => {
      throw new Error(`the Template has no ${file}.`, { cause: error });
    });
    prepared.push([path, prepare(text, project)]);
  }
  for (const [path, text] of prepared) await writeFile(path, text);
}

/**
 * `package.json` with the project name as its `name`, and the description
 * as its `description` (after `name` when the Template has none), every
 * other field in its place.
 */
function preparedManifest(text: string, project: ProjectIdentity): string {
  const manifest: unknown = JSON.parse(text);
  if (
    typeof manifest !== "object" ||
    manifest === null ||
    !("name" in manifest) ||
    typeof manifest.name !== "string"
  ) {
    throw new Error(
      "the Template's package.json has no `name` field, which the project name replaces.",
    );
  }
  const { description } = project;
  const fields: [string, unknown][] = [];
  for (const [key, value] of Object.entries(manifest)) {
    if (key === "name") {
      fields.push([key, project.name]);
      if (description !== undefined && !("description" in manifest)) {
        fields.push(["description", description]);
      }
    } else if (key === "description" && description !== undefined) {
      fields.push([key, description]);
    } else {
      fields.push([key, value]);
    }
  }
  return `${JSON.stringify(Object.fromEntries(fields), null, 2)}\n`;
}

/**
 * The README with the project name as its first-level title, and the
 * description in a paragraph of its own right under it.
 */
function preparedReadme(text: string, project: ProjectIdentity): string {
  const document = markdown(text);
  const title = document.lines.findIndex(
    (line, i) => document.free[i] && line.startsWith("# "),
  );
  if (title === -1) {
    throw new Error(
      "the Template's README.md has no first-level title (a line starting `# `), which the project name replaces.",
    );
  }
  const lines = [...document.lines];
  lines[title] = `# ${project.name}`;
  if (project.description !== undefined) {
    const paragraph = ["", project.description];
    if ((lines[title + 1] ?? "") !== "") paragraph.push("");
    lines.splice(title + 1, 0, ...paragraph);
  }
  return lines.join(document.eol);
}

/**
 * `AGENTS.md` with the description as the body of "Your project", up to the
 * next heading of its level or above; the Template's text without one.
 */
function preparedAgents(text: string, project: ProjectIdentity): string {
  const document = markdown(text);
  const { lines, free } = document;
  const heading = lines.findIndex(
    (line, i) => free[i] && line.trimEnd() === YOUR_PROJECT,
  );
  if (heading === -1) {
    throw new Error(
      `the Template's AGENTS.md has no \`${YOUR_PROJECT}\` heading, whose body the description replaces.`,
    );
  }
  if (project.description === undefined) return text;
  let end = heading + 1;
  while (
    end < lines.length &&
    !(document.unfenced[end] && /^#{1,2}\s/.test(lines[end] ?? ""))
  ) {
    end++;
  }
  if (lines.slice(heading + 1, end).some((line) => SYNC_MARKER.test(line))) {
    throw new Error(
      `the body of \`${YOUR_PROJECT}\` in the Template's AGENTS.md holds sync markers, whose text the description would replace.`,
    );
  }
  return [
    ...lines.slice(0, heading + 1),
    "",
    project.description,
    "",
    ...lines.slice(end),
  ].join(document.eol);
}

/**
 * The lines of a Markdown text, its line break, and for each line whether
 * it is outside a fenced code block (`unfenced`) and, further, outside the
 * sync markers and the text between them (`free`).
 */
function markdown(text: string): {
  lines: string[];
  eol: string;
  unfenced: boolean[];
  free: boolean[];
} {
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const unfenced: boolean[] = [];
  const free: boolean[] = [];
  let fence: string | undefined;
  let synced = false;
  for (const line of lines) {
    if (fence !== undefined) {
      unfenced.push(false);
      free.push(false);
      const close = line.trim();
      if (close.startsWith(fence) && /^(`+|~+)$/.test(close)) fence = undefined;
      continue;
    }
    const opening = FENCE.exec(line);
    if (opening !== null) {
      fence = opening[1];
      unfenced.push(false);
      free.push(false);
      continue;
    }
    unfenced.push(true);
    const marker = SYNC_MARKER.exec(line);
    if (marker !== null) synced = marker[1] === "start";
    free.push(marker === null && !synced);
  }
  return { lines, eol, unfenced, free };
}
