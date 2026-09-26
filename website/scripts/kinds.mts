// The kinds of source the collector's list is written with: a Markdown file
// copied as one page, the ADR folder, the package changelogs with their
// index, and the lint plugin's rule pages with theirs. A new kind is one more
// function returning a Source.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { SourceError, type Page, type Source } from "./collector.mts";
import {
  headingAnchor,
  headings,
  normalizeNewlines,
  splitFrontMatter,
  tableCell,
  takeTitle,
} from "./markdown.mts";

/** A repository text file, LF. */
export async function readText(root: string, path: string): Promise<string> {
  return normalizeNewlines(await readFile(join(root, path), "utf8"));
}

export interface MarkdownFileOptions {
  readonly name: string;
  /** The repository file. */
  readonly from: string;
  /** The page's path under the docs tree. */
  readonly to: string;
  readonly title: string;
  readonly position: number;
  /** Why the file may not exist yet; see `Source.absent`. */
  readonly absent?: string;
}

/**
 * One Markdown file copied as one page, without its front matter and the
 * first-level heading it opens on: the page's title replaces it.
 */
export function markdownFile(options: MarkdownFileOptions): Source {
  const { name, from, to, title, position, absent } = options;
  return {
    name,
    from,
    ...(absent === undefined ? {} : { absent }),
    outputs: [to],
    async collect({ root }) {
      const { body } = takeTitle(
        splitFrontMatter(await readText(root, from)).body,
      );
      return { pages: [{ path: to, from: [from], title, position, body }] };
    },
  };
}

export interface AdrFolderOptions {
  readonly name: string;
  /** The repository folder of the ADRs, `NNNN-<slug>.md` each. */
  readonly from: string;
  /** The docs tree folder the ADR pages and their index go to. */
  readonly to: string;
  /** The folder's label in the sidebar and its index's title. */
  readonly label: string;
  readonly position: number;
}

/**
 * The ADRs: one page per `NNNN-<slug>.md` file, titled "ADR NNNN: <its
 * heading>" and served at its file name (the number kept, which Docusaurus
 * would otherwise strip), and an index page listing them with their status
 * and date. A folder without an ADR fails.
 */
export function adrFolder(options: AdrFolderOptions): Source {
  const { name, from, to, label, position } = options;
  return {
    name,
    from,
    outputs: [to],
    async collect({ root }) {
      const files = (await readdir(join(root, from)))
        .filter((file) => /^\d{4}-.+\.md$/.test(file))
        .sort();
      if (files.length === 0) {
        throw new SourceError(`\`${from}\` holds no \`NNNN-<slug>.md\` file.`);
      }
      const rows: string[] = [];
      const pages: Page[] = [];
      for (const [index, file] of files.entries()) {
        const path = `${from}/${file}`;
        const { fields, body } = splitFrontMatter(await readText(root, path));
        const titled = takeTitle(body);
        if (titled.title === undefined) {
          throw new SourceError(
            `\`${path}\` does not open on its decision as a first-level heading.`,
          );
        }
        const number = file.slice(0, 4);
        const slug = file.replace(/\.md$/, "");
        pages.push({
          path: `${to}/${file}`,
          from: [path],
          title: `ADR ${number}: ${titled.title}`,
          sidebarLabel: `ADR ${number}`,
          position: index + 1,
          slug,
          body: titled.body,
        });
        rows.push(
          `| [${number}](${file}) | ${tableCell(titled.title)} | ${tableCell(fields.get("status") ?? "")} | ${tableCell(fields.get("date") ?? "")} |`,
        );
      }
      const index: Page = {
        path: `${to}/index.md`,
        from: [from],
        title: label,
        position: 0,
        body: [
          "One record per architecture decision, numbered in the order they were taken. A decision that replaces another says so in its record.",
          "",
          "| ADR | Decision | Status | Date |",
          "| --- | --- | --- | --- |",
          ...rows,
        ].join("\n"),
      };
      return {
        pages: [index, ...pages],
        files: [
          {
            path: `${to}/_category_.json`,
            text: `${JSON.stringify({ label, position }, null, 2)}\n`,
          },
        ],
      };
    },
  };
}

export interface ChangelogOptions {
  /** The packages, in their order in the section: folder names under `packages/`. */
  readonly packages: readonly string[];
  /** The docs tree folder of the section. */
  readonly to: string;
}

const CHANGELOG_ABSENT = "Changesets writes it at the package's first release.";

/**
 * One page per package from its `CHANGELOG.md` (absent before its first
 * release), and the section's index, which lists the packages and links
 * each release (every second-level heading of a changelog).
 */
export function changelogs(options: ChangelogOptions): Source[] {
  const { packages, to } = options;
  const changelog = (pkg: string) => `packages/${pkg}/CHANGELOG.md`;
  const pages = packages.map((pkg, index): Source =>
    markdownFile({
      name: `the changelog of ${pkg}`,
      from: changelog(pkg),
      to: `${to}/${pkg}.md`,
      title: pkg,
      position: index + 1,
      absent: CHANGELOG_ABSENT,
    }),
  );
  const index: Source = {
    name: "the changelog index",
    outputs: [`${to}/index.md`],
    async collect({ root }) {
      const from: string[] = [];
      const sections: string[] = [];
      for (const pkg of packages) {
        const path = changelog(pkg);
        const text = await readText(root, path).catch(() => undefined);
        if (text === undefined) {
          sections.push(`## ${pkg}`, "", "No release yet.", "");
          continue;
        }
        from.push(path);
        const releases = headings(takeTitle(text).body, 2).map(
          (release) => `- [${release}](/${path}#${headingAnchor(release)})`,
        );
        sections.push(
          `## [${pkg}](/${path})`,
          "",
          ...(releases.length > 0 ? releases : ["No release yet."]),
          "",
        );
      }
      return {
        pages: [
          {
            path: `${to}/index.md`,
            from,
            title: "Changelog",
            position: 0,
            body: [
              "Each package is versioned on its own and has its own changelog, which Changesets writes at every release (ADR 0009). Newest release first.",
              "",
              ...sections,
            ].join("\n"),
          },
        ],
      };
    },
  };
  return [...pages, index];
}

export interface LintRulesOptions {
  readonly name: string;
  /**
   * The lint plugin's package folder: its registry `src/rules/index.ts`,
   * from which its recommended config sets every rule, and one page per rule
   * in `docs/<rule>.md`.
   */
  readonly from: string;
  /** The docs tree folder of the guide: the rule pages and their index. */
  readonly to: string;
  /** The guide's label in the sidebar and its index's title. */
  readonly label: string;
  readonly position: number;
}

/**
 * The lint plugin's rule pages: one page per rule of its recommended config,
 * copied from the page the plugin ships, served at `<to>/<rule>` (the URL
 * the plugin's `meta.docs.url` builds), and the guide's index, which lists
 * each rule with its summary. A rule without a page and a page without a
 * rule fail, each named.
 */
export function lintRules(options: LintRulesOptions): Source {
  const { name, from, to, label, position } = options;
  const registry = `${from}/src/rules/index.ts`;
  const pages = `${from}/docs`;
  const page = (rule: string) => `${pages}/${rule}.md`;
  return {
    name,
    from,
    outputs: [to],
    async collect({ root }) {
      const rules = registeredRules(
        await readText(root, registry).catch(() => {
          throw new SourceError(`\`${registry}\` does not exist.`);
        }),
      );
      if (rules.length === 0) {
        throw new SourceError(
          `\`${registry}\` registers no rule: the collector reads one \`import <name> from "./<rule>.js";\` line per rule.`,
        );
      }
      const files = (await readdir(join(root, pages)).catch(() => []))
        .filter((file) => file.endsWith(".md"))
        .sort();
      const problems = [
        ...rules
          .filter((rule) => !files.includes(`${rule}.md`))
          .map(
            (rule) =>
              `the rule \`${rule}\` of the plugin's recommended config has no page: add \`${page(rule)}\`.`,
          ),
        ...files
          .filter((file) => !rules.includes(file.replace(/\.md$/, "")))
          .map(
            (file) =>
              `\`${pages}/${file}\` is the page of no rule of the plugin's recommended config: register the rule in \`${registry}\`, or delete the page.`,
          ),
      ];
      const [first, ...rest] = problems;
      if (first !== undefined) throw new SourceError(first, ...rest);

      const collected: Page[] = [];
      const items: string[] = [];
      for (const [index, rule] of [...rules].sort().entries()) {
        const { body } = takeTitle(
          splitFrontMatter(await readText(root, page(rule))).body,
        );
        collected.push({
          path: `${to}/${rule}.md`,
          from: [page(rule)],
          title: rule,
          position: index + 1,
          body,
        });
        items.push(`- [\`${rule}\`](${rule}.md): ${summary(body)}`);
      }
      const guide: Page = {
        path: `${to}/index.md`,
        from: [pages, registry],
        title: label,
        position: 0,
        body: [
          `\`eslint-plugin-reforged\` is the lint layer of the Guards: type-aware rules that report the Warcraft III scripting pitfalls (desync, crash, leak) in the editor and in CI, before the map compiles. Its recommended config sets every rule below, and each diagnostic links to its rule's page here. [Its README](/${from}/README.md) sets the plugin up, and [Desync safety and guards](/website/docs/guides/desync-safety-and-guards.md) says what the lint catches next to the type layer and the runtime Guards.`,
          "",
          "To silence a rule on one line, say why after `--`:",
          "",
          "```ts",
          "// eslint-disable-next-line reforged/<rule> -- <why the code is safe here>",
          "```",
          "",
          "## Rules",
          "",
          ...items,
        ].join("\n"),
      };
      return {
        pages: [guide, ...collected],
        files: [
          {
            path: `${to}/_category_.json`,
            text: `${JSON.stringify({ label, position }, null, 2)}\n`,
          },
        ],
      };
    },
  };
}

/**
 * The rules a lint plugin's registry registers: the module of each
 * `import <name> from "./<rule>.js";` line, named after its rule (the
 * plugin's convention, `src/rules/<rule>.ts`), in the registry's order.
 */
function registeredRules(registry: string): string[] {
  return [
    ...registry.matchAll(/^import\s+\w+\s+from\s+"\.\/([\w-]+)\.js";?$/gm),
  ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
}

/** A rule page's summary: its first paragraph, on one line. */
function summary(body: string): string {
  return (body.trim().split(/\n\s*\n/)[0] ?? "").replace(/\s*\n\s*/g, " ");
}
