// The migration guide's source kind (#40, #184): the generated sections of
// the hand-written migration pages, for each version pair of the library's
// rename map, and the checks that keep the map, the library and the pages in
// step. It reads the map through the rename map module the release gate and
// the library's tests share, from the release package's build (`pnpm
// install` builds it), and checks it against the library's built
// declarations (`pnpm build`).
import { access, readdir } from "node:fs/promises";
import { join, posix } from "node:path";
import {
  checkRenameMap,
  isNoRenamesMarker,
  migrationPagePath,
  renameEntries,
  replacements,
  versionPairs,
  type RenameMapCheck,
  type RenameMapItem,
  type VersionPair,
} from "reforged-ts-release/rename-map";
import { SourceError, type PagePartial, type Source } from "./collector.mts";
import { readText } from "./kinds.mts";
import {
  demoteHeadings,
  sections,
  splitFrontMatter,
  tableCell,
} from "./markdown.mts";

/** The behaviour changes of a version pair, as a note of the library lists them. */
export interface BehaviourChanges {
  readonly versions: VersionPair;
  /** The repository's Markdown note, one second-level section per change set. */
  readonly from: string;
}

export interface MigrationGuideOptions {
  readonly name: string;
  /** The library's rename map, its schema `renames.schema.json` next to it. */
  readonly map: string;
  /** The library's built declaration entry, which exports every replacement. */
  readonly declarations: string;
  /**
   * The repository folder of the migration pages. A pair's page is where the
   * release gate expects it, `migrationPagePath` (`.md` or `.mdx`); `index`
   * and `_`-prefixed files are not pages of a pair.
   */
  readonly pages: string;
  /**
   * The package whose majors the map's pairs are: a page whose target side
   * names another package (`reforged-builtins-1-to-reforged-builtins-2.md`)
   * is that package's, which the release gate checks, not a page of this map.
   */
  readonly package: string;
  /**
   * The docs tree folder of the partials, `_`-prefixed so that Docusaurus
   * serves none: one folder per pair, named as its page, holding
   * `renames.md` and, when the pair has a note, `behaviour-changes.md`.
   */
  readonly to: string;
  readonly behaviourChanges: readonly BehaviourChanges[];
}

/**
 * The migration guide's generated sections, for each version pair of the
 * rename map: the old-to-new table of the pair's entries (old, new or
 * removed, kind, note) or its no-renames marker's note, and the sections of
 * the pair's behaviour changes note a level down. Fails naming the offender
 * when the map does not match its schema, a replacement is not in the built
 * declarations, a pair has no page, a page has no pair, or a note is missing
 * or names a pair the map does not have.
 */
export function migrationGuide(options: MigrationGuideOptions): Source {
  const { name, map, declarations, pages, to, behaviourChanges } = options;
  /** Whether a page's target side names the package: `-to-reforged-ts-2.md`. */
  const ownPage = (file: string) =>
    new RegExp(
      `-to-${options.package.replace(/\./g, "\\.")}-\\d+\\.mdx?$`,
    ).test(file);
  return {
    name,
    from: map,
    outputs: [to],
    async collect({ root }) {
      if (!(await exists(join(root, declarations)))) {
        throw new SourceError(
          `\`${declarations}\` does not exist: build the library first (\`pnpm build\`), the replacements of the map are checked against its declarations.`,
        );
      }
      let check: RenameMapCheck;
      try {
        check = await checkRenameMap(join(root, map), join(root, declarations));
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        throw new SourceError(`\`${map}\`: ${error.message}`);
      }
      const { items, missing } = check;
      const pairs = versionPairs(items);
      const written = (await readdir(join(root, pages)).catch(() => []))
        .filter(
          (file) => /^(?!_|index\.)[^/]+\.mdx?$/.test(file) && ownPage(file),
        )
        .map((file) => `${pages}/${file}`);
      const isPageOf = (page: string, pair: VersionPair) =>
        page === migrationPagePath(pair) ||
        page === `${migrationPagePath(pair)}x`;

      const problems = [
        ...missing.map(
          ({ old, versions, symbol }) =>
            `the replacement \`${symbol}\` of \`${old}\` (${formatPair(versions)}) is not exported by \`${declarations}\`.`,
        ),
        ...pairs
          .filter((pair) => !written.some((page) => isPageOf(page, pair)))
          .map(
            (pair) =>
              `${formatPair(pair)} has no migration page: write \`${migrationPagePath(pair)}\`.`,
          ),
        ...written
          .filter((page) => !pairs.some((pair) => isPageOf(page, pair)))
          .map(
            (page) =>
              `\`${page}\` is the page of no version pair of \`${map}\`: add the pair's entries or its no-renames marker to the map, or delete the page.`,
          ),
      ];
      for (const { versions, from } of behaviourChanges) {
        if (!pairs.some((pair) => samePair(pair, versions))) {
          problems.push(
            `\`${from}\` lists the behaviour changes of ${formatPair(versions)}, a version pair \`${map}\` does not have.`,
          );
        }
        if (!(await exists(join(root, from)))) {
          problems.push(`\`${from}\` does not exist.`);
        }
      }
      const [first, ...rest] = problems;
      if (first !== undefined) throw new SourceError(first, ...rest);

      const partials: PagePartial[] = [];
      for (const pair of pairs) {
        const folder = `${to}/${posix.basename(migrationPagePath(pair), ".md")}`;
        partials.push({
          path: `${folder}/renames.md`,
          from: [map],
          body: renamesSection(items, pair),
        });
        const note = behaviourChanges.find(({ versions }) =>
          samePair(versions, pair),
        );
        if (note === undefined) continue;
        const { body } = splitFrontMatter(await readText(root, note.from));
        partials.push({
          path: `${folder}/behaviour-changes.md`,
          from: [note.from],
          // The note's title and introduction speak of the note itself.
          body: demoteHeadings(sections(body, 2), 1),
        });
      }
      return { partials };
    },
  };
}

/**
 * The renames section of `pair`: the table of its entries in the map's
 * order, or the note of its no-renames marker.
 */
function renamesSection(
  items: readonly RenameMapItem[],
  pair: VersionPair,
): string {
  const marker = items.find(
    (item) => isNoRenamesMarker(item) && samePair(item.versions, pair),
  );
  if (marker !== undefined) {
    return `No public symbol is removed or renamed from \`${pair.from}\` to \`${pair.to}\`. ${marker.note}`;
  }
  const code = (symbol: string) => `\`${tableCell(symbol)}\``;
  const rows = renameEntries(items)
    .filter((entry) => samePair(entry.versions, pair))
    .map((entry) => {
      // A package's replacement is a package name, not a symbol.
      const next =
        entry.kind === "package" && typeof entry.new === "string"
          ? [entry.new]
          : replacements(entry);
      const cells = [
        code(entry.old),
        next.length === 0 ? "removed" : next.map(code).join(", "),
        entry.kind,
        tableCell(entry.note),
      ];
      return `| ${cells.join(" | ")} |`;
    });
  return [
    "| Old | New | Kind | Note |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function samePair(a: VersionPair, b: VersionPair): boolean {
  return a.from === b.from && a.to === b.to;
}

/** `w3ts@3 to reforged-ts@1`, as the release gate names a pair. */
function formatPair(pair: VersionPair): string {
  return `${pair.from} to ${pair.to}`;
}

async function exists(path: string): Promise<boolean> {
  return access(path).then(
    () => true,
    () => false,
  );
}
