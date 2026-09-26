// docs:collect, run before every build: populates the generated parts of the
// docs tree from their sources of truth, through one declarative list (#40).
// The list is empty until the collector's first sources land (#179).

/** One source of truth the collector copies into the docs tree. */
export interface Source {
  /** What the source is, as the report names it: "the glossary". */
  readonly name: string;
}

/** Every source the collector copies, in the order it copies them. */
export const SOURCES: readonly Source[] = [];

console.log(`docs:collect: collected ${String(SOURCES.length)} sources.`);
