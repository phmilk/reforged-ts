/**
 * The packages diagram: the workspace's packages from their manifests, the
 * published ones apart from the private ones, an edge for each workspace
 * package a `dependencies` or `peerDependencies` entry names (devDependencies
 * left out), and the Template, as the Reference consumer, and a Map project
 * as fixed external nodes. It lands in the README's "Map".
 */
import { getPackages } from "@manypkg/get-packages";
import type { Diagram } from "./diagrams.js";
import { mermaidBlock, mermaidIds, mermaidLabel } from "./mermaid.js";
import { byCodePoint } from "./order.js";
import { isRecord } from "./unknown.js";
import type { PackageManifest } from "./workspace.js";

const PUBLISHED = "published";
const PRIVATE = "private";
const MAP_PROJECT = "map_project";
const TEMPLATE = "template";

/** The names an object field of a manifest holds as keys. */
const keysOf = (field: unknown): string[] =>
  isRecord(field) ? Object.keys(field) : [];

const isOptionalPeer = (meta: unknown, name: string): boolean => {
  const entry = isRecord(meta) ? meta[name] : undefined;
  return isRecord(entry) && entry.optional === true;
};

async function render(root: string): Promise<string> {
  const { packages } = await getPackages(root);
  const manifests = packages
    // The whole parsed file: manypkg types only the fields it reads.
    .map(({ packageJson }) => packageJson as PackageManifest)
    .map((manifest) => ({ name: manifest.name, manifest }))
    .sort((a, b) => byCodePoint(a.name, b.name));
  const ids = mermaidIds(
    manifests.map(({ name }) => name),
    [PUBLISHED, PRIVATE, MAP_PROJECT, TEMPLATE],
  );
  const id = (name: string) => ids.get(name) ?? name;

  const subgraph = (key: string, title: string, isPrivate: boolean) => [
    `subgraph ${key}[${mermaidLabel(title)}]`,
    ...manifests
      .filter(({ manifest }) => (manifest.private === true) === isPrivate)
      .map(({ name }) => `  ${id(name)}[${mermaidLabel(name)}]`),
    "end",
  ];

  const edges: string[] = [];
  for (const { name, manifest } of manifests) {
    const dependencies = new Set(keysOf(manifest.dependencies));
    const targets = [
      ...new Set([...dependencies, ...keysOf(manifest.peerDependencies)]),
    ]
      .filter((target) => ids.has(target))
      .sort(byCodePoint);
    for (const target of targets) {
      const arrow = dependencies.has(target)
        ? "-->"
        : `-.->|${mermaidLabel(
            isOptionalPeer(manifest.peerDependenciesMeta, target)
              ? "optional peer"
              : "peer",
          )}|`;
      edges.push(`${id(name)} ${arrow} ${id(target)}`);
    }
  }

  return mermaidBlock("packages", "flowchart LR", [
    "%% Generated from each workspace package's dependencies and peerDependencies; devDependencies are left out.",
    ...subgraph(PUBLISHED, "Published packages", false),
    ...subgraph(PRIVATE, "Private packages", true),
    `${MAP_PROJECT}([${mermaidLabel("Map project")}])`,
    `${TEMPLATE}([${mermaidLabel("Template: phmilk/reforged-ts-template")}])`,
    ...edges,
    `${MAP_PROJECT} -->|${mermaidLabel("starts from")}| ${TEMPLATE}`,
    `${TEMPLATE} -->|${mermaidLabel(
      "builds every release before it is published (Template gate)",
    )}| ${PUBLISHED}`,
  ]);
}

export const packagesDiagram: Diagram = {
  name: "packages",
  document: "README.md",
  render,
};
