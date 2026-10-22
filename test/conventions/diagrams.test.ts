// The convention test of the Mermaid diagrams (ADR 0019). It reads every
// `mermaid` block of the tracked Markdown files (`.md` and `.mdx`, committed
// or new, never ignored; not the frozen Docs versions under
// website/versioned_docs/) and fails when a diagram drifts from the
// repository. A generated diagram (`pnpm diagrams:generate`) is read too, so
// the generator follows the same rules as a hand-written one.
//
// The rules a diagram follows:
//
// 1. Its name: one Mermaid comment `%% diagram: <name>` inside the block, the
//    name in kebab-case and unique across the repository. The Map and the
//    tests refer to a diagram by it.
// 2. The set it covers, when it covers one: `%% covers: workflows`,
//    `%% covers: packages` or `%% covers: skills`, one line each. The diagram
//    then cites every member of that set, in the forms below: every file of
//    .github/workflows/, every workspace package, every folder of
//    .claude/skills/ (the project's Agent skills; the external ones are no
//    set). Adding a member fails until the diagram shows it.
// 3. The identifiers it cites, each of which must exist. Only these forms are
//    read, anywhere in the block but its `%%` comment lines; any other text is
//    free:
//    - A workflow: its file name, `ci.yml` (a `<name>.yml` or `<name>.yaml`
//      with no folder), or its path, `.github/workflows/ci.yml`. A file of
//      .github/workflows/, or one of another repository declared in
//      `external.workflows` below (the Template's `sync.yml`).
//    - A file: any other `.yml` or `.yaml` path with a folder, from the
//      repository root (`.github/ISSUE_TEMPLATE/bug-report.yml`).
//    - A root script: `pnpm <script>` or `pnpm run <script>`
//      (`pnpm typings:check`), a script of the root package.json. pnpm's own
//      commands (`pnpm install`, `pnpm dlx`, the list below) and a flag
//      (`pnpm --filter <package> <script>`, a package's own script) are not
//      read as one.
//    - A package: any word holding `reforged` (`reforged-ts`,
//      `eslint-plugin-reforged`, a scoped `@scope/reforged-x`), the name of a
//      workspace package, or of a package of another repository declared in
//      `external.packages` (the Template's, `reforged-ts-template`). A word
//      right after a `/` is not read: `phmilk/reforged-ts` is a repository,
//      `reforged/no-bj` a lint rule. Write "the Template" and "a Map project"
//      in words: they are terms of CONTEXT.md, not identifiers.
//    - An Agent skill: its slash command, `/tdd`, where no letter, digit,
//      `_`, `-`, `.`, `:`, `@` or `/` comes right before the `/` (a path or
//      `and/or` is not one).
//      A folder of .claude/skills/, or a skill of `external.skills`, declared
//      with its source.
// 4. Its node ids are read like its labels: give a node an id with
//    underscores, which no form above reads (`reforged_ts["reforged-ts"]`),
//    and quote every label (`a["/tdd"]`: an unquoted `[/` opens a Mermaid
//    shape).
// 5. No `click`: the docs collector does not rewrite a link inside a
//    diagram. The table under the diagram links each node to its section.
// 6. Its row in the README's "Map": `| <to understand> | \`<name>\` |
//    [<doc>, "<section>"](<doc>#<section>) |`, the link to its doc and to the
//    heading right above the block. A diagram without its row fails, and so
//    does a row naming no diagram.
//
// A hand-written diagram can still draw a wrong edge between two names that
// exist: the test does not see it (ADR 0019, "Consequences").
import { execFileSync } from "node:child_process";
import { existsSync, globSync } from "node:fs";
import { posix } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vitest";

import { read, root } from "./repository.js";

// What a diagram cites, by kind, each in the order it first appears.
interface Citations {
  workflows: string[];
  files: string[];
  scripts: string[];
  packages: string[];
  skills: string[];
}

type Coverable = "workflows" | "packages" | "skills";
const coverable: readonly Coverable[] = ["workflows", "packages", "skills"];

function isCoverable(set: string): set is Coverable {
  return (coverable as readonly string[]).includes(set);
}

interface Diagram {
  file: string;
  // The line of the block's opening fence, from 1.
  line: number;
  // The text of the heading right above the block, of any level.
  heading: string | undefined;
  // The `%% diagram:` names it declares: one, unless it is wrong.
  names: string[];
  // The `%% covers:` sets it declares, as written.
  covers: string[];
  citations: Citations;
  // Whether a line of it is a `click`.
  clicks: boolean;
}

// What a diagram may cite and the sets it may cover, all members of which it
// then cites.
interface Repository {
  known: { [Kind in keyof Citations]: ReadonlySet<string> };
  sets: Record<Coverable, ReadonlySet<string>>;
}

// pnpm's own commands, which `pnpm <command>` does not cite as a root script.
const pnpmCommands = new Set([
  "add",
  "audit",
  "create",
  "dlx",
  "exec",
  "i",
  "install",
  "outdated",
  "pack",
  "publish",
  "remove",
  "update",
  "why",
]);

const workflowFolder = ".github/workflows/";

// The identifiers a text cites, in the forms of rule 3 above.
function cite(text: string): Citations {
  const found = {
    workflows: new Set<string>(),
    files: new Set<string>(),
    scripts: new Set<string>(),
    packages: new Set<string>(),
    skills: new Set<string>(),
  };
  for (const [, path = ""] of text.matchAll(
    /(?<![\w./-])((?:[\w.-]+\/)*[\w.-]+\.ya?ml)(?![\w/-]|\.\w)/g,
  )) {
    const inWorkflows = path.startsWith(workflowFolder)
      ? path.slice(workflowFolder.length)
      : undefined;
    if (!path.includes("/")) found.workflows.add(path);
    else if (inWorkflows !== undefined && !inWorkflows.includes("/")) {
      found.workflows.add(inWorkflows);
    } else found.files.add(path);
  }
  for (const [, first = "", second = ""] of text.matchAll(
    /(?<![\w-])pnpm\s+([\w:.-]+)(?:\s+([\w:.-]+))?/g,
  )) {
    const script = (first === "run" ? second : first).replace(/[.:]+$/, "");
    if (script !== "" && !script.startsWith("-") && !pnpmCommands.has(script)) {
      found.scripts.add(script);
    }
  }
  for (const [name] of text.matchAll(
    /(?<![\w@/.-])(?:@[a-z0-9-]+\/)?[a-z0-9-]*reforged[a-z0-9-]*(?![\w/-]|\.\w)/g,
  )) {
    found.packages.add(name);
  }
  for (const [, name = ""] of text.matchAll(
    /(?<![\w./:@-])\/([a-z][a-z0-9-]*)(?![\w/-]|\.\w)/g,
  )) {
    found.skills.add(name);
  }
  return {
    workflows: [...found.workflows],
    files: [...found.files],
    scripts: [...found.scripts],
    packages: [...found.packages],
    skills: [...found.skills],
  };
}

// The body of each fenced code block of a Markdown file whose info string is
// `mermaid`, with the line of its opening fence and the heading right above
// it. Fences follow CommonMark, as the generator's do (release/src/diagrams.ts):
// a fence is indented by three spaces at most (four make indented code), and
// a block closes on a fence of the same character at least as long as the
// opening one, so a `mermaid` block shown inside a longer fence is not read,
// and a `#` line inside a fence is no heading.
function mermaidBlocks(
  markdown: string,
): { line: number; heading: string | undefined; lines: string[] }[] {
  const blocks: {
    line: number;
    heading: string | undefined;
    lines: string[];
  }[] = [];
  let open: { fence: string; mermaid: boolean; line: number } | undefined;
  let heading: string | undefined;
  let body: string[] = [];
  markdown.split(/\r?\n/).forEach((text, index) => {
    if (open === undefined) {
      const opening = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)/.exec(text);
      if (opening) {
        const [, fence = "", info = ""] = opening;
        open = { fence, mermaid: info === "mermaid", line: index + 1 };
        body = [];
      }
      heading =
        /^ {0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$/.exec(text)?.[1] ?? heading;
      return;
    }
    const closing = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(text)?.[1];
    if (
      closing !== undefined &&
      closing.startsWith(open.fence.charAt(0)) &&
      closing.length >= open.fence.length
    ) {
      if (open.mermaid) blocks.push({ line: open.line, heading, lines: body });
      open = undefined;
      return;
    }
    body.push(text);
  });
  return blocks;
}

// The diagrams of a Markdown file: its `mermaid` blocks, each with its
// declarations and what it cites. Pure: the file is given as text.
function readDiagrams(file: string, markdown: string): Diagram[] {
  return mermaidBlocks(markdown).map(({ line, heading, lines }) => {
    const declared = (key: string) =>
      lines.flatMap((text) => {
        const value = new RegExp(`^\\s*%%\\s*${key}:\\s*(.*?)\\s*$`).exec(
          text,
        )?.[1];
        return value === undefined ? [] : [value];
      });
    const shown = lines.filter((text) => !/^\s*%%/.test(text));
    return {
      file,
      line,
      heading,
      names: declared("diagram"),
      covers: declared("covers"),
      citations: cite(shown.join("\n")),
      clicks: shown.some((text) => /^\s*click\s/.test(text)),
    };
  });
}

const unknown: { [Kind in keyof Citations]: (name: string) => string } = {
  workflows: (name) =>
    `the workflow ${name}, which is neither a file of .github/workflows/ nor a declared external workflow`,
  files: (name) => `the file ${name}, which the repository does not hold`,
  scripts: (name) =>
    `"pnpm ${name}", and ${name} is not a script of the root package.json`,
  packages: (name) =>
    `the package ${name}, which is neither a workspace package nor a declared external package`,
  skills: (name) =>
    `the Agent skill /${name}, which is neither a folder of .claude/skills/ nor a declared external skill`,
};

const kinds = Object.keys(unknown) as (keyof Citations)[];

// Every way the diagrams break the rules of the header comment, one message
// each, naming the file, the line of the block and what is wrong.
function diagramProblems(
  diagrams: readonly Diagram[],
  repository: Repository,
): string[] {
  const named = new Map<string, string[]>();
  const problems = diagrams.flatMap(
    ({ file, line, names, covers, citations, clicks }) => {
      const where = `${file}:${String(line)}`;
      const [name] = names;
      const label = `${where}: diagram "${name ?? "(unnamed)"}"`;
      const found: string[] = [];
      if (name === undefined) {
        found.push(
          `${where}: a mermaid block without a name: add "%% diagram: <name>" inside it`,
        );
      } else if (names.length > 1) {
        found.push(`${label} declares ${String(names.length)} names: keep one`);
      } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
        found.push(`${label}: its name is not kebab-case`);
      } else {
        named.set(name, [...(named.get(name) ?? []), where]);
      }
      for (const set of covers) {
        if (!isCoverable(set)) {
          found.push(
            `${label} covers "${set}", which is not one of ${coverable.join(", ")}`,
          );
          continue;
        }
        const shown = new Set(citations[set]);
        for (const member of repository.sets[set]) {
          if (!shown.has(member)) {
            const cited = set === "skills" ? `/${member}` : member;
            found.push(
              `${label} covers the ${set} and does not show ${cited}: add it to the diagram`,
            );
          }
        }
      }
      for (const kind of kinds) {
        for (const cited of citations[kind]) {
          if (!repository.known[kind].has(cited)) {
            found.push(`${label} cites ${unknown[kind](cited)}`);
          }
        }
      }
      if (clicks) {
        found.push(
          `${label} has a click: link the node from the table under the diagram instead`,
        );
      }
      return found;
    },
  );
  for (const [name, places] of named) {
    if (places.length > 1) {
      problems.push(
        `diagram "${name}" is declared ${String(places.length)} times: ${places.join(", ")}`,
      );
    }
  }
  return problems;
}

// A row of the README's "Map": the diagram it names and the link to where it
// sits, each undefined when the row does not hold one.
interface MapRow {
  // Its line in the README, from 1.
  line: number;
  diagram: string | undefined;
  link: string | undefined;
}

// The rows of the table of the README's "Map" whose header opens on
// "To understand": `| <to understand> | \`<name>\` | [<where>](<link>) |`.
// Pure: the README is given as text.
function readMap(readme: string): MapRow[] {
  const rows: MapRow[] = [];
  let inMap = false;
  let inTable = false;
  let fenced = false;
  readme.split(/\r?\n/).forEach((text, index) => {
    if (/^\s*(`{3,}|~{3,})/.test(text)) fenced = !fenced;
    if (fenced) return;
    if (text.startsWith("## ")) inMap = text === "## Map";
    if (!inMap || !text.startsWith("|")) {
      inTable = false;
      return;
    }
    if (/^\|\s*To understand\s*\|/.test(text)) {
      inTable = true;
      return;
    }
    if (!inTable || /^\|[\s:|-]*$/.test(text)) return;
    const [, , diagram = "", where = ""] = text.split("|");
    rows.push({
      line: index + 1,
      diagram: /^\s*`([^`]+)`\s*$/.exec(diagram)?.[1],
      link: /\]\(([^)\s]+)\)/.exec(where)?.[1],
    });
  });
  return rows;
}

// The anchor GitHub gives a heading: lower case, punctuation dropped, spaces
// turned into hyphens.
function anchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replaceAll(" ", "-");
}

// The link a Map row of a diagram holds: its doc, from the root, and the
// anchor of the heading right above it; only the anchor in the README itself.
function mapLink({ file, heading }: Diagram): string {
  const section = `#${anchor(heading ?? "")}`;
  return file === "README.md" ? section : `${file}${section}`;
}

// Every way the Map and the diagrams differ: a diagram without its row, a row
// naming no diagram or one that does not exist, a diagram listed twice, a row
// linking elsewhere than the diagram's doc and section.
function mapProblems(
  rows: readonly MapRow[],
  diagrams: readonly Diagram[],
): string[] {
  const byName = new Map(
    diagrams.flatMap((diagram) =>
      diagram.names.length === 1 ? [[diagram.names[0] ?? "", diagram]] : [],
    ),
  );
  const listed = new Set<string>();
  const problems = rows.flatMap(({ line, diagram: name, link }) => {
    const where = `README.md:${String(line)}`;
    if (name === undefined) {
      return [
        `${where}: a row of the Map names no diagram: write its name in backticks in the second column`,
      ];
    }
    if (listed.has(name)) {
      return [`${where}: the Map lists diagram "${name}" twice: keep one row`];
    }
    listed.add(name);
    const diagram = byName.get(name);
    if (diagram === undefined) {
      return [
        `${where}: the Map lists diagram "${name}", which no mermaid block declares: remove the row, or add the diagram`,
      ];
    }
    const expected = mapLink(diagram);
    return link === expected
      ? []
      : [
          `${where}: the Map's row of diagram "${name}" links ${link ?? "nothing"}, not its doc and section: ${expected}`,
        ];
  });
  for (const [name, { file, line }] of byName) {
    if (!listed.has(name)) {
      problems.push(
        `diagram "${name}" (${file}:${String(line)}) is missing from the README's "Map": add its row`,
      );
    }
  }
  return problems;
}

describe("the extraction of a diagram", () => {
  const fixture: Repository = {
    known: {
      workflows: new Set(["ci.yml", "claim.yml", "sync.yml"]),
      files: new Set([
        ".github/ISSUE_TEMPLATE/bug-report.yml",
        ".github/workflows/ci.yml",
        ".github/workflows/claim.yml",
      ]),
      scripts: new Set(["check", "typings:generate"]),
      packages: new Set(["reforged-test", "reforged-ts", "reforged-types"]),
      skills: new Set(["add-wrapper", "new-patch", "tdd"]),
    },
    sets: {
      workflows: new Set(["ci.yml", "claim.yml"]),
      packages: new Set(["reforged-test", "reforged-ts", "reforged-types"]),
      skills: new Set(["add-wrapper", "new-patch"]),
    },
  };

  function mermaid(...body: string[]): string {
    return ["# A doc", "", "```mermaid", ...body, "```", ""].join("\n");
  }

  function problems(markdown: string): string[] {
    return diagramProblems(readDiagrams("docs/a.md", markdown), fixture);
  }

  it("reads the identifiers a block cites, and only those", () => {
    const [diagram] = readDiagrams(
      "docs/a.md",
      mermaid(
        "flowchart LR",
        "  %% diagram: a-b",
        "  %% a comment: unknown.yml, pnpm nope and /nope are not read",
        '  pr["a pull request"] -->|"on: pull_request"| ci["ci.yml"]',
        '  ci --> check["pnpm check, pnpm run typings:generate."]',
        '  check --> filter["pnpm --filter reforged-test build, pnpm install"]',
        '  reforged_ts["reforged-ts"] --> types["reforged-types (phmilk/reforged-ts)"]',
        '  forms[".github/ISSUE_TEMPLATE/bug-report.yml"] -->|"/add-wrapper"| x["and/or 1/2"]',
        '  y["reforged/no-bj, @me"] --> z[".github/workflows/claim.yml@master"]',
      ),
    );
    expect(diagram).toEqual({
      file: "docs/a.md",
      line: 3,
      heading: "A doc",
      names: ["a-b"],
      covers: [],
      citations: {
        workflows: ["ci.yml", "claim.yml"],
        files: [".github/ISSUE_TEMPLATE/bug-report.yml"],
        scripts: ["check", "typings:generate"],
        packages: ["reforged-test", "reforged-ts", "reforged-types"],
        skills: ["add-wrapper"],
      },
      clicks: false,
    });
  });

  it("reads only mermaid blocks, not one shown inside a longer fence", () => {
    const markdown = [
      "```sh",
      "pnpm nope",
      "```",
      "",
      "````md",
      "```mermaid",
      "flowchart LR",
      "```",
      "````",
      "",
      "~~~mermaid",
      "flowchart LR",
      "  %% diagram: tilde",
      "~~~",
      "",
    ].join("\n");
    expect(readDiagrams("docs/a.md", markdown).map(({ line }) => line)).toEqual(
      [11],
    );
  });

  it("reads a fence indented by three spaces at most, as the generator does: four make indented code", () => {
    const markdown = [
      "    ```mermaid",
      "    flowchart LR",
      "      %% diagram: indented-code",
      "    ```",
      "",
      "   ```mermaid",
      "   flowchart LR",
      "     %% diagram: three-spaces",
      "    ```",
      "   ```",
      "",
    ].join("\n");
    expect(
      readDiagrams("docs/a.md", markdown).map(({ line, names }) => ({
        line,
        names,
      })),
    ).toEqual([{ line: 6, names: ["three-spaces"] }]);
  });

  it("reads the heading right above a block, not a `#` line inside a fence", () => {
    const markdown = [
      "# A doc",
      "",
      "## The section ##",
      "",
      "```sh",
      "# a comment",
      "```",
      "",
      "```mermaid",
      "flowchart LR",
      "```",
      "",
    ].join("\n");
    expect(
      readDiagrams("docs/a.md", markdown).map(({ heading }) => heading),
    ).toEqual(["The section"]);
  });

  it("passes a named block citing what exists", () => {
    expect(
      problems(
        mermaid(
          "stateDiagram-v2",
          "  %% diagram: a-b",
          "  [*] --> claimed : /tdd, pnpm check",
          "  claimed --> [*] : claim.yml",
        ),
      ),
    ).toEqual([]);
  });

  it("passes a generated packages diagram: packages, the Template and a Map project", () => {
    const generated = [
      "<!-- diagram:packages generated by pnpm diagrams:generate, never edit by hand -->",
      "",
      "```mermaid",
      "flowchart LR",
      "  %% diagram: packages",
      "  %% covers: packages",
      '  reforged_ts["reforged-ts"] --> reforged_types["reforged-types"]',
      '  reforged_test["reforged-test"] --> reforged_ts',
      '  template["the Template (reforged-ts-template)"] --> reforged_ts',
      '  map_project["a Map project"] --> template',
      "```",
      "",
      "<!-- /diagram:packages -->",
      "",
    ].join("\n");
    const repository: Repository = {
      ...fixture,
      known: {
        ...fixture.known,
        packages: new Set([...fixture.sets.packages, "reforged-ts-template"]),
      },
    };
    expect(
      diagramProblems(readDiagrams("README.md", generated), repository),
    ).toEqual([]);
  });

  it("fails on a block without a name, naming the file", () => {
    expect(problems(mermaid("flowchart LR", "  a --> b"))).toEqual([
      expect.stringContaining("docs/a.md:3: a mermaid block without a name"),
    ]);
  });

  it("fails on a name that is not kebab-case", () => {
    expect(
      problems(mermaid("flowchart LR", "  %% diagram: Issue_Life")),
    ).toEqual([expect.stringContaining("not kebab-case")]);
  });

  it("fails on two diagrams of the same name, naming both", () => {
    const block = mermaid("flowchart LR", "  %% diagram: a-b");
    expect(
      diagramProblems(
        [
          ...readDiagrams("docs/a.md", block),
          ...readDiagrams("docs/b.md", block),
        ],
        fixture,
      ),
    ).toEqual([expect.stringContaining("docs/a.md:3, docs/b.md:3")]);
  });

  it("fails on an unknown workflow, naming it", () => {
    expect(
      problems(mermaid("flowchart LR", "  %% diagram: a-b", '  a["nope.yml"]')),
    ).toEqual([expect.stringContaining("the workflow nope.yml")]);
  });

  it("fails on an unknown file, naming it", () => {
    expect(
      problems(
        mermaid("flowchart LR", "  %% diagram: a-b", '  a[".github/nope.yml"]'),
      ),
    ).toEqual([expect.stringContaining("the file .github/nope.yml")]);
  });

  it("fails on an unknown root script, naming it", () => {
    expect(
      problems(
        mermaid(
          "flowchart LR",
          "  %% diagram: a-b",
          '  a["pnpm typings:nope"]',
        ),
      ),
    ).toEqual([expect.stringContaining('"pnpm typings:nope"')]);
  });

  it("fails on an unknown package, naming it", () => {
    expect(
      problems(
        mermaid("flowchart LR", "  %% diagram: a-b", '  a["reforged-nope"]'),
      ),
    ).toEqual([expect.stringContaining("the package reforged-nope")]);
  });

  it("fails on an unknown Agent skill, naming it", () => {
    expect(
      problems(mermaid("flowchart LR", "  %% diagram: a-b", '  a["/nope"]')),
    ).toEqual([expect.stringContaining("the Agent skill /nope")]);
  });

  it("fails on a missing member of the set a block covers, naming it", () => {
    expect(
      problems(
        mermaid(
          "flowchart LR",
          "  %% diagram: a-b",
          "  %% covers: skills",
          '  a["/add-wrapper"] --> b["/tdd"]',
        ),
      ),
    ).toEqual([
      expect.stringContaining("covers the skills and does not show /new-patch"),
    ]);
  });

  it("passes a block that shows every member of the set it covers", () => {
    expect(
      problems(
        mermaid(
          "flowchart LR",
          "  %% diagram: a-b",
          "  %% covers: workflows",
          '  a["ci.yml"] --> b[".github/workflows/claim.yml"]',
        ),
      ),
    ).toEqual([]);
  });

  it("fails on a set it does not know, naming it", () => {
    expect(
      problems(
        mermaid("flowchart LR", "  %% diagram: a-b", "  %% covers: scripts"),
      ),
    ).toEqual([expect.stringContaining('covers "scripts"')]);
  });

  it("fails on a click", () => {
    expect(
      problems(
        mermaid(
          "flowchart LR",
          "  %% diagram: a-b",
          "  a --> b",
          '  click a "https://example.com"',
        ),
      ),
    ).toEqual([expect.stringContaining("has a click")]);
  });
});

describe("the Map", () => {
  const diagrams = [
    ...readDiagrams(
      "README.md",
      [
        "## Map",
        "",
        "```mermaid",
        "flowchart LR",
        "  %% diagram: a-b",
        "```",
      ].join("\n"),
    ),
    ...readDiagrams(
      "docs/c.md",
      [
        "# C",
        "",
        "### The `c-d` flow",
        "",
        "```mermaid",
        "flowchart LR",
        "  %% diagram: c-d",
        "```",
      ].join("\n"),
    ),
  ];

  function readme(...rows: string[]): string {
    return [
      "## Docs",
      "",
      "| To understand | Read the diagram | In |",
      "| --- | --- | --- |",
      "| not the Map | `x-y` | [x](x.md) |",
      "",
      "## Map",
      "",
      "| To understand | Read the diagram | In |",
      "| ------------- | :--------------: | -- |",
      ...rows,
      "",
      "```mermaid",
      "flowchart LR",
      "  %% diagram: a-b",
      "```",
      "",
      "| Node | Read |",
      "| --- | --- |",
      "| `a` | [a](a.md) |",
      "",
      "## Commands",
      "",
    ].join("\n");
  }

  const ab = '| the a and the b | `a-b` | [README.md, "Map"](#map) |';
  const cd =
    '| the c and the d | `c-d` | [docs/c.md, "The c-d flow"](docs/c.md#the-c-d-flow) |';

  it("reads only the rows of the Map's table of diagrams", () => {
    expect(readMap(readme(ab, cd))).toEqual([
      { line: 11, diagram: "a-b", link: "#map" },
      { line: 12, diagram: "c-d", link: "docs/c.md#the-c-d-flow" },
    ]);
  });

  it("passes a Map listing every diagram, at its doc and section", () => {
    expect(mapProblems(readMap(readme(ab, cd)), diagrams)).toEqual([]);
  });

  it("fails on a diagram missing from the Map, naming it", () => {
    expect(mapProblems(readMap(readme(ab)), diagrams)).toEqual([
      expect.stringContaining(
        `diagram "c-d" (docs/c.md:5) is missing from the README's "Map"`,
      ),
    ]);
  });

  it("fails on a row of the Map with no diagram, naming it", () => {
    expect(
      mapProblems(
        readMap(readme(ab, cd, "| the e | `e-f` | [docs/e.md](docs/e.md) |")),
        diagrams,
      ),
    ).toEqual([
      expect.stringContaining(
        `README.md:13: the Map lists diagram "e-f", which no mermaid block declares`,
      ),
    ]);
  });

  it("fails on a row naming no diagram", () => {
    expect(
      mapProblems(
        readMap(readme(ab, cd, "| the e | e-f | [docs/e.md](docs/e.md) |")),
        diagrams,
      ),
    ).toEqual([
      expect.stringContaining(
        "README.md:13: a row of the Map names no diagram",
      ),
    ]);
  });

  it("fails on a diagram listed twice", () => {
    expect(mapProblems(readMap(readme(ab, cd, ab)), diagrams)).toEqual([
      expect.stringContaining(`the Map lists diagram "a-b" twice`),
    ]);
  });

  it("fails on a row linking elsewhere than the diagram's doc and section", () => {
    expect(
      mapProblems(
        readMap(readme(ab, "| the c | `c-d` | [docs/c.md](docs/c.md#c) |")),
        diagrams,
      ),
    ).toEqual([
      expect.stringContaining(
        `the Map's row of diagram "c-d" links docs/c.md#c, not its doc and section: docs/c.md#the-c-d-flow`,
      ),
    ]);
  });
});

// What the diagrams may cite from outside the repository, by source: a
// diagram of a flow that crosses into another repository or runs an Agent
// skill installed per machine names them. Add a name here, under its source,
// before a diagram cites it.
const external: Record<
  "workflows" | "packages" | "skills",
  Record<string, string[]>
> = {
  // The Template's own board.yml and claim.yml share their names with this
  // repository's: they are its callers of board-dispatch.yml and
  // claim-check.yml (docs/release.md, "The board").
  workflows: {
    "phmilk/reforged-ts-template": ["board.yml", "claim.yml", "sync.yml"],
  },
  packages: { "phmilk/reforged-ts-template": ["reforged-ts-template"] },
  // The published skills of mattpocock/skills (skills/engineering and
  // skills/productivity), read on 2026-10-22: docs/agents/development-loop.md
  // says how they are installed.
  skills: {
    "mattpocock/skills": [
      "ask-matt",
      "code-review",
      "codebase-design",
      "diagnosing-bugs",
      "domain-modeling",
      "grill-me",
      "grill-with-docs",
      "grilling",
      "handoff",
      "implement",
      "implement-spec",
      "improve-codebase-architecture",
      "pr",
      "prototype",
      "research",
      "retro",
      "setup-matt-pocock-skills",
      "tdd",
      "teach",
      "to-questionnaire",
      "to-spec",
      "to-tickets",
      "triage",
      "wait-what",
      "wayfinder",
      "wizard",
      "writing-for-agents",
    ],
  },
};

function externalNames(kind: keyof typeof external): string[] {
  return Object.values(external[kind]).flat();
}

// The repository's files: committed or new, never ignored (node_modules,
// build output, the collected docs pages, the agents' worktrees).
const files = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
)
  .split("\0")
  .filter((file) => file !== "" && existsSync(posix.join(root, file)));

const workflows = files
  .filter((file) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file))
  .map((file) => posix.basename(file));

const scripts = Object.keys(
  (JSON.parse(read("package.json")) as { scripts: Record<string, string> })
    .scripts,
);

const packages = (() => {
  const { packages: patterns } = parse(read("pnpm-workspace.yaml")) as {
    packages: string[];
  };
  return globSync(patterns, { cwd: root })
    .map((path) => posix.join(path.replaceAll("\\", "/"), "package.json"))
    .filter((manifest) => existsSync(posix.join(root, manifest)))
    .map((manifest) => (JSON.parse(read(manifest)) as { name: string }).name);
})();

const skills = files.flatMap(
  (file) => /^\.claude\/skills\/([^/]+)\/SKILL\.md$/.exec(file)?.[1] ?? [],
);

const repository: Repository = {
  known: {
    workflows: new Set([...workflows, ...externalNames("workflows")]),
    files: new Set(files),
    scripts: new Set(scripts),
    packages: new Set([...packages, ...externalNames("packages")]),
    skills: new Set([...skills, ...externalNames("skills")]),
  },
  sets: {
    workflows: new Set(workflows),
    packages: new Set(packages),
    skills: new Set(skills),
  },
};

const diagrams = files
  .filter(
    (file) =>
      /\.mdx?$/.test(file) && !file.startsWith("website/versioned_docs/"),
  )
  .sort()
  .flatMap((file) => readDiagrams(file, read(file)));

describe("the diagrams of the repository", () => {
  it("reads the sets a diagram may cover from the repository", () => {
    expect(workflows, "the files of .github/workflows/").toContain("ci.yml");
    expect(packages, "the workspace packages").toContain("reforged-ts");
    expect(skills, "the folders of .claude/skills/").toContain("add-wrapper");
  });

  it("are each named, cite only what exists and show every member of the set they cover", () => {
    expect(
      diagramProblems(diagrams, repository),
      "the mermaid blocks of the tracked Markdown files: follow the rules in the header comment of test/conventions/diagrams.test.ts",
    ).toEqual([]);
  });

  it("include an issue's life, in the Claim section of the issue tracker doc", () => {
    expect(
      diagrams
        .filter(({ names }) => names.includes("issue-life"))
        .map(({ file }) => file),
    ).toEqual(["docs/agents/issue-tracker.md"]);
  });

  it("include a Patch's adoption, in CONTRIBUTING.md, citing the Patch watch, the new-patch skill and the steps that need the game", () => {
    const adoption = diagrams.filter(({ names }) =>
      names.includes("patch-adoption"),
    );
    expect(adoption.map(({ file }) => file)).toEqual(["CONTRIBUTING.md"]);
    const [{ citations } = { citations: cite("") }] = adoption;
    expect(citations.workflows).toContain("patch-watch.yml");
    expect(citations.skills).toContain("new-patch");
    expect(citations.scripts).toEqual(
      expect.arrayContaining([
        "typings:generate",
        "typings:check",
        "builtins:generate",
        "probe:run",
      ]),
    );
    expect(citations.packages).toContain("reforged-types");
  });

  it("include the development loop, covering the Agent skills, in its agents doc", () => {
    expect(
      diagrams
        .filter(({ names }) => names.includes("development-loop"))
        .map(({ file, covers }) => ({ file, covers })),
    ).toEqual([
      { file: "docs/agents/development-loop.md", covers: ["skills"] },
    ]);
  });

  it("include the docs site, in the website's README", () => {
    expect(
      diagrams
        .filter(({ names }) => names.includes("docs-site"))
        .map(({ file }) => file),
    ).toEqual(["website/README.md"]);
  });

  it("include a Probe run, in probe/README.md, with each state of its table and that state's exit code", () => {
    const file = "probe/README.md";
    expect(
      diagrams
        .filter(({ names }) => names.includes("probe-run"))
        .map(({ file }) => file),
    ).toEqual([file]);
    const readme = read(file);
    const section = readme.slice(
      readme.indexOf("### States of a Probe run"),
      readme.indexOf("### Where the Result file is"),
    );
    // A row of the table: | `finished` | the file holds ... | 0 |
    const states = [
      ...section.matchAll(/^\|\s*`([\w-]+)`\s*\|.*\|\s*(\d+)\s*\|$/gm),
    ].map(([, state = "", code = ""]) => `"${state}, exit ${code}"`);
    expect(states, `the table of "States of a Probe run"`).toHaveLength(6);
    const block = mermaidBlocks(readme)
      .map(({ lines }) => lines.join("\n"))
      .find((text) => /^\s*%%\s*diagram:\s*probe-run\s*$/m.test(text));
    for (const state of states) {
      expect(block, `the probe-run diagram labels a state ${state}`).toContain(
        state,
      );
    }
  });

  it("include the Claim board's reconcile, in the board section of the release doc", () => {
    expect(
      diagrams
        .filter(({ names }) => names.includes("claim-board"))
        .map(({ file, heading }) => `${file}, ${String(heading)}`),
    ).toEqual(["docs/release.md, The board"]);
  });

  it("include the Init stages, in the Init stages guide of the docs site", () => {
    expect(
      diagrams
        .filter(({ names }) => names.includes("init-stages"))
        .map(({ file }) => file),
    ).toEqual(["website/docs/guides/init-stages.md"]);
  });

  // The "Map" heading itself is guarded with the other README sections
  // AGENTS.md points at, in agents-md.test.ts.
  it("are each listed in the README's Map, at their doc and section, and the Map lists only them", () => {
    expect(
      mapProblems(readMap(read("README.md")), diagrams),
      `the README's "Map" and the mermaid blocks of the tracked Markdown files: give each diagram one row, as rule 6 of the header comment of test/conventions/diagrams.test.ts says`,
    ).toEqual([]);
  });

  it("are reached from the docs site's Contributing page, through the Map on GitHub", () => {
    expect(
      read("website/docs/contributing/index.mdx"),
      "the README is not collected: the Contributing page links its Map",
    ).toContain("https://github.com/phmilk/reforged-ts#map");
  });
});
