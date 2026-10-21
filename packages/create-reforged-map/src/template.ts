/**
 * Where the Template comes from. A source writes the Template's files into
 * an empty folder; `create` never knows whether they came from an archive,
 * a folder or a download.
 */
import { cp, readFile, stat } from "node:fs/promises";
import { basename } from "node:path";
import { ArchiveError, extractArchive } from "./tar.js";

/** The Template's files, from somewhere. */
export interface TemplateSource {
  /** Where it comes from, for the messages: "the archive t.tar.gz". */
  description: string;
  /** Writes the Template's files into the empty folder `folder`. */
  write: (folder: string) => Promise<void>;
}

/**
 * What a folder source leaves out: the Template checkout's own git
 * repository, and what its install writes.
 */
const NOT_COPIED = new Set([".git", "node_modules"]);

/**
 * The Template at `path` on this machine: a tar archive, gzipped or not,
 * whose one top-level folder is left out (GitHub's tarball of a ref, or
 * `git archive --prefix`), or a folder whose files are copied but for
 * `.git` and `node_modules`.
 */
export function localTemplate(path: string): TemplateSource {
  return {
    description: path,
    write: async (folder) => {
      const found = await stat(path).catch(() => null);
      if (found === null)
        throw new Error(`there is no file or folder ${path}.`);
      if (found.isDirectory()) {
        await cp(path, folder, {
          recursive: true,
          filter: (source) => !NOT_COPIED.has(basename(source)),
        });
      } else {
        try {
          await extractArchive(await readFile(path), folder);
        } catch (error) {
          if (!(error instanceof ArchiveError)) throw error;
          throw new Error(`${path} cannot be read: ${error.message}.`, {
            cause: error,
          });
        }
      }
    },
  };
}
