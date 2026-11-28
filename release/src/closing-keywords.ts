/**
 * The closing keywords of a pull request's description, read as GitHub
 * documents them ("Linking a pull request to an issue"): `close`, `closes`,
 * `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves` or `resolved`,
 * in any case, followed by a colon or not, then `#<n>` for an issue of the
 * pull request's repository or `<owner>/<name>#<n>` for one of another;
 * each issue needs its own keyword. GitHub reads them only on a pull
 * request into the default branch (`closingIssuesReferences`); on one into
 * the Next branch, `next`, the claim check (`claim-check.ts`) and the close
 * of `next-close.yml` (`next-close.ts`) read them here instead
 * (docs/release.md, "Closing a Ticket delivered on `next`"). Nothing inside
 * code counts, a fenced block or a code span, since GitHub links no
 * reference there.
 *
 * Self-contained on purpose, as the claim check is: no import beyond
 * `issue-markdown.ts`, self-contained in the same way, and erasable syntax
 * only, so that Node runs it from a checkout with no install and no build.
 */
import { isFence, linesOf } from "./issue-markdown.ts";

/** An issue named by its repository (`owner/name`) and number. */
export interface IssueRef {
  repository: string;
  number: number;
}

/** A keyword, a colon or not, then an issue: its repository or none, its number. */
const CLOSING =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)(?::[ \t]*|[ \t]+)(?:([A-Za-z0-9-]+\/[A-Za-z0-9_.-]+))?#(\d+)\b/gi;

/** A code span: a run of backticks, what it holds, and the same run again. */
const CODE_SPAN = /(`+)[^`]*?\1/g;

/**
 * The issues the closing keywords of `body`, a pull request's description,
 * name, in the order each first appears, once each; an issue of
 * `repository` carries that spelling of it, since GitHub reads owners and
 * names in any case.
 */
export function closingReferences(
  body: string,
  repository: string,
): IssueRef[] {
  const found: IssueRef[] = [];
  const seen = new Set<string>();
  let fence = false;
  for (const line of linesOf(body)) {
    if (isFence(line)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    for (const match of line.replace(CODE_SPAN, " ").matchAll(CLOSING)) {
      // Undefined when `#<n>` names no repository.
      const named = match.at(1);
      const ref = {
        repository:
          named === undefined ||
          named.toLowerCase() === repository.toLowerCase()
            ? repository
            : named,
        number: Number(match[2]),
      };
      const key = `${ref.repository.toLowerCase()}#${String(ref.number)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push(ref);
    }
  }
  return found;
}
