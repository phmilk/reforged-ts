// Every source docs:collect copies into the docs tree, in the order it
// copies them. Adding a source: add its entry here, its outputs to the
// `.gitignore` block of the collected pages, and a page linking it if its
// section does not list its pages by itself.
import type { Source } from "./collector.mts";
import { adrFolder, changelogs, markdownFile } from "./kinds.mts";

/** The published packages, in the order of the Changelog section. */
const PACKAGES = [
  "reforged-ts",
  "reforged-types",
  "reforged-test",
  "eslint-plugin-reforged",
];

export const SOURCES: readonly Source[] = [
  // The Contributing section: the project's own files for contributors,
  // listed by the section's index.
  markdownFile({
    name: "the contributing guide",
    from: "CONTRIBUTING.md",
    to: "contributing/guide.md",
    title: "Contributing guide",
    position: 1,
    absent: "The contribution model (#193) adds CONTRIBUTING.md.",
  }),
  markdownFile({
    name: "the glossary",
    from: "CONTEXT.md",
    to: "contributing/glossary.md",
    title: "Glossary",
    position: 2,
  }),
  adrFolder({
    name: "the ADRs",
    from: "docs/adr",
    to: "contributing/adr",
    label: "Architecture decisions",
    position: 3,
  }),
  markdownFile({
    name: "the agent conventions",
    from: "AGENTS.md",
    to: "contributing/agent-conventions.md",
    title: "Agent conventions",
    position: 4,
  }),
  markdownFile({
    name: "the add-wrapper Agent skill",
    from: ".claude/skills/add-wrapper/SKILL.md",
    to: "contributing/adding-a-wrapper.md",
    title: "Adding a Wrapper",
    position: 5,
    absent: "The add-wrapper Agent skill (#202) is not written yet.",
  }),
  markdownFile({
    name: "the lint plugin's conventions",
    from: "packages/eslint-plugin-reforged/AGENTS.md",
    to: "contributing/adding-a-lint-rule.md",
    title: "Adding a lint rule",
    position: 6,
  }),
  markdownFile({
    name: "the Typings' conventions",
    from: "packages/reforged-types/AGENTS.md",
    to: "contributing/adding-a-patch.md",
    title: "Adding a Patch",
    position: 7,
  }),

  // The Changelog section: one page per package and the index.
  ...changelogs({ packages: PACKAGES, to: "changelog" }),
];
