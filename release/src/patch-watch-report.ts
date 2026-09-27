/**
 * What the Patch watch opens for a new live Patch, as Markdown: the issue,
 * in the body of the "New game Patch" issue form, and the draft pull
 * request, whose body turns the output of `typings:generate <tag>` into the
 * curation checklist. Pure: the workflow captures the generator's output and
 * opens both with `gh`.
 */
import { isBuild } from "./build.js";
import type { NewPatch } from "./patch-watch.js";
import { errorMessage, isRecord } from "./unknown.js";

/** The part of the plan command's JSON the reports read. */
export interface ReportedPlan {
  /** The supported Patch the plan compared against. */
  supported: string;
  /** Whether `supported` is the `--simulate-current-patch` override. */
  simulated: boolean;
  patch: NewPatch;
  superseded: NewPatch[];
}

/** An issue or a pull request. */
export interface Report {
  title: string;
  body: string;
}

/** What `typings:generate <tag>` printed, and its exit code. */
export interface GeneratorRun {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** GitHub's limit on an issue or pull request body, in characters. */
export const MAX_BODY_LENGTH = 65_536;

/** `text` as a Markdown code span, whatever backticks it holds. */
function code(text: string): string {
  const longest = Math.max(
    0,
    ...(text.match(/`+/g) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longest + 1);
  const pad = text.startsWith("`") || text.endsWith("`") ? " " : "";
  return `${fence}${pad}${text}${pad}${fence}`;
}

/** `text` as a fenced code block, whatever backtick runs it holds. */
function codeBlock(text: string): string {
  const longest = Math.max(
    2,
    ...(text.match(/^`+/gm) ?? []).map((run) => run.length),
  );
  const fence = "`".repeat(longest + 1);
  const body = text.endsWith("\n") || text === "" ? text : `${text}\n`;
  return `${fence}text\n${body}${fence}\n`;
}

const link = (text: string, url: string) => `[${text}](${url})`;

/** The note that marks a rehearsal's issue or pull request. */
function rehearsal(plan: ReportedPlan, closing: string): string {
  return plan.simulated
    ? `\n> [!NOTE]\n> A rehearsal: the watch ran with the supported Patch simulated as ${plan.supported}. Close ${closing}, remove the \`game-patch\` label from the issue (the watch skips a Build a labelled issue names, even closed) and delete the branch.\n`
    : "";
}

/**
 * The issue that reports the plan's Patch: one `### <label>` section per
 * field of `.github/ISSUE_TEMPLATE/new-game-patch.yml`, in its order, as
 * GitHub writes a form's issue. The title holds the Build, which is how the
 * watch finds the report again.
 */
export function renderIssue(input: {
  plan: ReportedPlan;
  runUrl?: string;
}): Report {
  const { plan, runUrl } = input;
  const { patch } = plan;
  const found =
    runUrl === undefined
      ? "the Patch watch found it."
      : `the Patch watch found it in its ${link("workflow run", runUrl)}.`;
  const supported = plan.simulated
    ? `${plan.supported} (simulated)`
    : plan.supported;
  const superseded =
    plan.superseded.length === 0
      ? `The supported Patch is ${supported}. No other live Build was released since.\n`
      : `The supported Patch is ${supported}. This Build supersedes the other live Builds released since, which the watch does not report on their own:\n\n` +
        plan.superseded
          .map(
            (older) =>
              `- ${older.build}, tag ${older.tag}: ${older.links.tag}\n`,
          )
          .join("");
  const fields: [string, string][] = [
    ["Build", `${patch.build}\n`],
    ["jass-history tag", `${patch.tag}\n`],
    [
      "Where it was observed",
      `jass-history tagged Build ${patch.build} (Game version ${patch.gameVersion}) at commit ${patch.commit}; ${found}\n\n` +
        `- Tag: ${patch.links.tag}\n` +
        `- Commit: ${patch.links.commit}\n` +
        `- Patch files: ${patch.links.scripts}\n`,
    ],
    [
      "Additional context",
      `${superseded}\n` +
        "The Patch watch opens a draft pull request with the vendored Patch files and the curation checklist.\n" +
        rehearsal(plan, "this issue and its pull request"),
    ],
  ];
  return {
    title: `New Patch: ${patch.build}`,
    body: fields.map(([label, value]) => `### ${label}\n\n${value}`).join("\n"),
  };
}

/** A declaration without an Overlay entry. */
interface MissingEntry {
  source: string;
  name: string;
  declaration: string;
  /** Where the entry goes, relative to the Overlay folder. */
  path: string;
}

/** An Overlay entry whose parameters differ from the Patch. */
interface ParameterMismatch {
  source: string;
  name: string;
  declaration: string;
  /** The entry's file, relative to the Overlay folder. */
  file: string;
  /** The entry's parameter names, as the generator lists them. */
  overlay: string;
}

/** The declarations a Patch has and the one before it has not. */
interface Additions {
  patch: string;
  heading: string;
  /** `source:line` and the Jass declaration. */
  items: { location: string; declaration: string }[];
}

/** The generator's output, read as its checklist. */
interface Checklist {
  missing: MissingEntry[];
  mismatches: ParameterMismatch[];
  /** The parser's `unknown line` errors, verbatim. */
  parseErrors: string[];
  /** Any other error, verbatim. */
  errors: string[];
  warnings: string[];
  additions: Additions[];
}

// The generator's line formats: packages/reforged-types/src/cli/checklist.ts
// (the sections), src/cli/generate.ts (the additions) and the messages of
// src/resolve.ts and src/parser.ts.
const SECTION = /^(Errors|Warnings) \(\d+\):$/;
const ITEM = /^- \[ \] (.*)$/;
const ADDITIONS = /^In Patch (\S+) and not in Patch (\S+) \(\d+\):$/;
const ADDITION = /^- (.+?:\d+): (.*)$/;
const MISSING = /^(.+?): no Overlay entry for (.+); expected (.+)$/;
const MISMATCH =
  /^(.+?): parameters do not match the Patch: (.+); Overlay has \((.*)\)$/;
const UNKNOWN_LINE = /:\d+: unknown line: /;

/** The last segment of an entry path, without `.json`. */
const entryName = (path: string) =>
  (path.split("/").at(-1) ?? path).replace(/\.json$/, "");

function readError(checklist: Checklist, message: string): void {
  const missing = MISSING.exec(message);
  if (missing) {
    const [, source = "", declaration = "", path = ""] = missing;
    checklist.missing.push({
      source,
      name: entryName(path),
      declaration,
      path,
    });
    return;
  }
  const mismatch = MISMATCH.exec(message);
  if (mismatch) {
    const [, file = "", declaration = "", overlay = ""] = mismatch;
    checklist.mismatches.push({
      source: file.split("/")[0] ?? file,
      name: entryName(file),
      declaration,
      file,
      overlay,
    });
    return;
  }
  if (UNKNOWN_LINE.test(message)) checklist.parseErrors.push(message);
  else checklist.errors.push(message);
}

/** Reads the checklist and the additions out of a generator run. */
function readChecklist(run: GeneratorRun): Checklist {
  const checklist: Checklist = {
    missing: [],
    mismatches: [],
    parseErrors: [],
    errors: [],
    warnings: [],
    additions: [],
  };
  let section: "Errors" | "Warnings" | Additions | undefined;
  for (const line of `${run.stdout}\n${run.stderr}`.split(/\r?\n/)) {
    const heading = SECTION.exec(line);
    const additions = ADDITIONS.exec(line);
    const item = ITEM.exec(line);
    const addition = ADDITION.exec(line);
    if (heading) {
      section = heading[1] === "Errors" ? "Errors" : "Warnings";
    } else if (additions) {
      const [, patch = "", previous = ""] = additions;
      section = {
        patch,
        heading: `In Patch ${patch} and not in Patch ${previous}`,
        items: [],
      };
      checklist.additions.push(section);
    } else if (section === "Errors" && item) {
      readError(checklist, item[1]);
    } else if (section === "Warnings" && item) {
      checklist.warnings.push(item[1]);
    } else if (typeof section === "object" && addition) {
      const [, location = "", declaration = ""] = addition;
      section.items.push({ location, declaration });
    } else {
      section = undefined;
    }
  }
  return checklist;
}

/** A section of the checklist: a heading, what to do, the items. */
interface Section {
  heading: string;
  intro?: string;
  items: string[];
}

function sections(checklist: Checklist, exitCode: number): Section[] {
  const unexplained =
    exitCode !== 0 &&
    checklist.missing.length +
      checklist.mismatches.length +
      checklist.parseErrors.length +
      checklist.errors.length ===
      0;
  const all: Section[] = [
    {
      heading: "Missing Overlay entries",
      intro:
        "Write each entry at its path under `packages/reforged-types/overlay/`, following the curation rules.",
      items: checklist.missing.map(
        (entry) =>
          `${code(entry.name)} in ${code(entry.source)}: ${code(entry.declaration)} at ${code(entry.path)}`,
      ),
    },
    {
      heading: "Parameter mismatches",
      intro:
        "Make each entry's `params` match the Patch signature: count, order and names.",
      items: checklist.mismatches.map(
        (entry) =>
          `${code(entry.name)} in ${code(entry.source)}: the Patch declares ${code(entry.declaration)}; ${code(entry.file)} has ${code(`(${entry.overlay})`)}`,
      ),
    },
    {
      heading: "Parse errors",
      intro:
        "The Patch uses grammar the parser rejects: extend `packages/reforged-types/src/parser.ts` with a test, never skip the line.",
      items: checklist.parseErrors.map(code),
    },
    {
      heading: "Other errors",
      items: [
        ...(unexplained
          ? [
              `Generation failed with exit code ${String(exitCode)} and no checklist: read the generator output below.`,
            ]
          : []),
        ...checklist.errors.map(code),
      ],
    },
    { heading: "Warnings", items: checklist.warnings.map(code) },
    ...checklist.additions.map((additions) => ({
      heading: additions.heading,
      intro: `Set \`since\` to ${additions.patch} on the Overlay entry of each function and global.`,
      items: additions.items.map(
        ({ location, declaration }) =>
          `${code(location)}: ${code(declaration)}`,
      ),
    })),
  ];
  return all.filter((section) => section.items.length > 0);
}

/**
 * The checklist's Markdown, with at most `limit` items; a line counts the
 * items left out.
 */
function renderChecklist(all: readonly Section[], limit: number): string {
  let left = limit;
  let dropped = 0;
  const parts: string[] = [];
  for (const section of all) {
    const shown = section.items.slice(0, Math.max(0, left));
    left -= shown.length;
    dropped += section.items.length - shown.length;
    if (shown.length === 0) continue;
    parts.push(
      `### ${section.heading} (${String(section.items.length)})\n\n` +
        (section.intro === undefined ? "" : `${section.intro}\n\n`) +
        shown.map((item) => `- [ ] ${item}\n`).join(""),
    );
  }
  if (dropped > 0) {
    parts.push(
      `${String(dropped)} more ${dropped === 1 ? "item does" : "items do"} not fit this description: read them in the generator output of the workflow run.\n`,
    );
  }
  return parts.join("\n");
}

const FOOTER =
  "---\n" +
  "\n" +
  "Curation is human: the Patch watch opened this draft and never merges or publishes it. " +
  "Follow the New Patch loop of `packages/reforged-types/AGENTS.md`. Merge only when:\n" +
  "\n" +
  "- every item of the checklist is checked;\n" +
  "- the Typings drift check (`pnpm typings:check`) is green;\n" +
  "- a changeset bumps `reforged-types` by a minor, and the other packages as `docs/release.md` says (Choosing the bump for a Patch).\n";

/**
 * The draft pull request of the plan's Patch: the generator's output as the
 * curation checklist (each missing Overlay entry with its source, name and
 * signature; each parameter mismatch; parse errors and anything else
 * verbatim; the declarations to set `since` on), the output itself, and the
 * fixed footer. `issue` is the issue it closes; `null` in a dry run, which
 * opens none. The body stays within GitHub's limit: the output goes first,
 * then the items that do not fit, counted.
 */
export function renderPullRequest(input: {
  plan: ReportedPlan;
  issue: number | null;
  run: GeneratorRun;
  runUrl?: string;
}): Report {
  const { plan, issue, run, runUrl } = input;
  const { patch } = plan;
  const succeeded = run.exitCode === 0;
  const all = sections(readChecklist(run), run.exitCode);

  const intro =
    (issue === null
      ? "Closes the issue the Patch watch opens.\n"
      : `Closes #${String(issue)}.\n`) +
    "\n" +
    `The Patch watch found Patch ${patch.build}, tagged ${link(code(patch.tag), patch.links.tag)} ` +
    `at commit ${link(code(patch.commit.slice(0, 7)), patch.links.commit)} in jass-history, ` +
    `and ran ${code(`pnpm typings:generate ${patch.tag}`)}` +
    (runUrl === undefined ? "" : ` in its ${link("workflow run", runUrl)}`) +
    ".\n" +
    "\n" +
    (succeeded
      ? "**Generation succeeded**: this pull request holds the vendored Patch files, their provenance and the generated Typings.\n"
      : `**Generation failed** (exit code ${String(run.exitCode)}), as expected for a new Patch: ` +
        "this pull request holds the vendored Patch files and their provenance. " +
        "The generated Typings come with the curation.\n") +
    rehearsal(plan, "this pull request and its issue");
  const output =
    "<details>\n" +
    "<summary><code>typings:generate</code> printed</summary>\n" +
    "\n" +
    codeBlock(run.stdout + run.stderr) +
    "\n" +
    "</details>\n";
  const tooLong =
    "The output is too long for this description: read it in the " +
    (runUrl === undefined
      ? "workflow run's log.\n"
      : `${link("workflow run", runUrl)}.\n`);

  const body = (limit: number, generatorOutput: string) =>
    `${intro}\n## Curation checklist\n\n` +
    (all.length === 0
      ? "The generator reported no error and no warning.\n"
      : renderChecklist(all, limit)) +
    `\n## Generator output\n\n${generatorOutput}\n${FOOTER}`;

  const total = all.reduce((count, section) => count + section.items.length, 0);
  let text = body(total, output);
  if (text.length > MAX_BODY_LENGTH) text = body(total, tooLong);
  if (text.length > MAX_BODY_LENGTH) {
    // The most items that fit, by bisection.
    let low = 0;
    let high = total;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (body(middle, tooLong).length <= MAX_BODY_LENGTH) low = middle;
      else high = middle - 1;
    }
    text = body(low, tooLong);
  }
  return {
    title: `feat(reforged-types): support Patch ${patch.build}`,
    body: text,
  };
}

function isNewPatch(value: unknown): value is NewPatch {
  return (
    isRecord(value) &&
    isBuild(value.build) &&
    typeof value.gameVersion === "string" &&
    typeof value.tag === "string" &&
    typeof value.commit === "string" &&
    isRecord(value.links) &&
    typeof value.links.tag === "string" &&
    typeof value.links.commit === "string" &&
    typeof value.links.scripts === "string"
  );
}

/**
 * Reads the JSON `patch-watch:plan --json` printed. Throws when it is not
 * that JSON, or when the plan has no new Patch.
 */
export function readReportedPlan(text: string): ReportedPlan {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`The plan is not JSON: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  if (isRecord(value) && value.patch === null) {
    throw new Error("The plan has no new Patch to report.");
  }
  if (
    !isRecord(value) ||
    !isBuild(value.supported) ||
    typeof value.simulated !== "boolean" ||
    !isNewPatch(value.patch) ||
    !Array.isArray(value.superseded) ||
    !value.superseded.every(isNewPatch)
  ) {
    throw new Error("The plan is not the JSON of patch-watch:plan --json.");
  }
  return {
    supported: value.supported,
    simulated: value.simulated,
    patch: value.patch,
    superseded: value.superseded,
  };
}
