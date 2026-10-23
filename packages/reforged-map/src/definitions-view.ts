// The Object definitions' part of the one view of the map's objects (#700,
// "Loading definitions"; #707): what generateObjects and the Rawcode lookup
// take from a Map project's definitions and its Object manifest. The view
// is the map folder's objects, minus each object the manifest owns that no
// definition defines, plus every definition; mapFolderObjects applies it.
// Only the definitions' identity is checked here, as on every load: their
// fields are the build's and the sync's to check.

import {
  loadObjectDefinitions,
  projectPaths,
  type ObjectDefinitionsOptions,
} from "./definitions.js";
import { definitionFiles, displayPath } from "./definitions-loader.js";
import type { ObjectKind } from "./model.js";
import {
  byKindThenRawcode,
  objectKey,
  readObjectManifest,
} from "./object-manifest.js";
import type { DefinitionsInView } from "./objects.js";

/**
 * The definitions of a Map project, each with its identity checked, and the
 * objects its Object manifest owns that no definition defines. A Map
 * project without a definition file needs neither `typescript` nor
 * `reforged-builtins`.
 *
 * @throws {@link ObjectDefinitionsError} When a definition file cannot be
 *   loaded, a definition's identity is invalid, a Rawcode is defined twice
 *   in one kind, the manifest cannot be read, or a peer is missing.
 */
export function definitionsView(
  projectRoot: string,
  options: ObjectDefinitionsOptions,
): DefinitionsInView {
  const paths = projectPaths(projectRoot, options);
  const loaded = loadObjectDefinitions(paths);
  const manifest = readObjectManifest(paths.manifest, paths.projectRoot);
  const defined = [...(loaded?.definitions ?? [])]
    .sort(byKindThenRawcode)
    .map(({ kind, rawcode, base, file, record }) => ({
      kind,
      rawcode,
      base,
      fields: record.fields,
      file,
      path: displayPath(paths.projectRoot, file),
    }));
  const keys = new Set(defined.map(objectKey));
  const dropped: { kind: ObjectKind; rawcode: string }[] = manifest.owned
    .filter((entry) => !keys.has(objectKey(entry)))
    .map(({ kind, rawcode }) => ({ kind, rawcode }));
  return { defined, dropped };
}

/**
 * The files a view of the definitions reads, absolute: every definition
 * file under the definitions folder, then the Object manifest. A file that
 * appears or disappears changes the list.
 */
export function definitionsViewFiles(
  projectRoot: string,
  options: ObjectDefinitionsOptions,
): string[] {
  const paths = projectPaths(projectRoot, options);
  return [...definitionFiles(paths.definitionsFolder), paths.manifest];
}
