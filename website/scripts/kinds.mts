// The kinds of source the collector's list is written with: a Markdown file
// copied as one page, the ADR folder, and the package changelogs with their
// index. A new kind is one more function returning a Source.
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
