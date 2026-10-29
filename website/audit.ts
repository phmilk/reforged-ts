// docs:audit, the library's documentation audit (#43): every doc comment the
// library still lacks, per file, largest first, then a total. Two sources:
// TypeDoc, run with the options of the site's library reference and its
// plugin, emitting nothing, whose warnings are those `docs:check` logs (an
// undocumented symbol first); and ESLint with the workspace's configuration
// (eslint.config.mjs), of which only the doc comment rules count: they fail
// `pnpm lint` too. With `--strict`, which the root script passes, exit code
// 1 on any finding; without it, 0. 1 on a TypeDoc error either way, 2 on
// arguments. Node runs it from source, like the site's scripts; it sits
// beside reference.ts, whose compiler options it shares, since it runs the
// library's reference.
//
//   pnpm docs:audit                        every file
//   pnpm docs:audit handles/unit.ts        the files whose path ends so
//   pnpm docs:audit --summary              the counts per file alone
//   pnpm docs:audit --strict               fail on any finding
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ESLint } from "eslint";
import {
  Application,
  Logger,
  LogLevel,
  type MinimalNode,
  MinimalSourceFile,
  PackageJsonReader,
  TSConfigReader,
  TypeDocReader,
} from "typedoc";
import {
  type Reference,
  referenceTypedocOptions,
  siteReferences,
} from "./reference.ts";

/** Where the report and the usage go. */
export interface Output {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

const PROCESS_OUTPUT: Output = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

/** What the audit runs on. */
export interface AuditSubject {
  /** The folder the report's paths are relative to, absolute. */
  readonly root: string;
  /** The reference whose TypeDoc run lists the undocumented symbols. */
  readonly reference: Reference;
  /** ESLint's options: the configuration with the doc comment rules. */
  readonly eslint: ESLint.Options;
  /** What ESLint lints, relative to its `cwd`. */
  readonly lint: readonly string[];
}

/** This repository: the library, as the site documents it. */
export function workspaceSubject(): AuditSubject {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const library = siteReferences().at(0);
  if (library === undefined) {
    throw new Error("The site generates no reference of the library.");
  }
  return {
    root,
    reference: library,
    eslint: { cwd: root },
    lint: ["packages/reforged-ts/src"],
  };
}

/** One finding, on a file or on none (a TypeDoc warning naming no file). */
export interface Finding {
  readonly source: "undocumented" | "typedoc" | "lint";
  /** The file, relative to the subject's root, POSIX slashes. */
  readonly file: string | undefined;
  /** 1-based, when the finding has a position. */
  readonly line?: number;
  readonly column?: number;
  /** The lint rule. */
  readonly rule?: string;
  readonly message: string;
}

/** What the audit found. */
export interface AuditReport {
  readonly findings: readonly Finding[];
  /** TypeDoc's errors: the run is broken, whatever the findings. */
  readonly errors: readonly string[];
}

/** A TypeDoc message, where TypeDoc gave a file. */
interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly fileName?: string;
  readonly line?: number;
  readonly column?: number;
}

/** A logger that prints nothing and keeps each warning and error. */
class RecordingLogger extends Logger {
  readonly records: LogRecord[] = [];

  protected override addContext(
    message: string,
    level: Exclude<LogLevel, LogLevel.None>,
    ...args: [MinimalNode?] | [number, MinimalSourceFile]
  ): string {
    if (level === LogLevel.Warn || level === LogLevel.Error) {
      const [nodeOrPos, sourceFile] = args;
      const [pos, file] =
        nodeOrPos === undefined
          ? []
          : typeof nodeOrPos === "number"
            ? [nodeOrPos, sourceFile]
            : [nodeOrPos.getStart(), nodeOrPos.getSourceFile()];
      const where = file?.getLineAndCharacterOfPosition(pos ?? 0);
      this.records.push({
        level,
        message,
        ...(file === undefined || where === undefined
          ? {}
          : {
              fileName: file.fileName,
              line: where.line + 1,
              column: where.character + 1,
            }),
      });
    }
    return message;
  }
}

/** TypeDoc's `notDocumented` warning, in English (the `lang` the audit sets). */
const NOT_DOCUMENTED =
  /^(?<name>.+) \((?<kind>\w+)\), defined in [^,]+, does not have any documentation$/;

/**
 * The file a validation warning names, as `<package name>/<path>`, where it
 * gives no position: `notDocumented` and `notExported` do.
 */
const DEFINED_IN = /, defined in (?<path>[^,]+), /;

/**
 * Runs TypeDoc as the site's reference does, without writing a page: it
 * converts, then validates, which is where `docs:check` logs its warnings.
 */
async function typedocFindings(
  subject: AuditSubject,
): Promise<{ findings: Finding[]; errors: string[] }> {
  const options = referenceTypedocOptions(subject.reference, {
    strict: false,
  });
  const app = await Application.bootstrapWithPlugins(
    // English, which the warnings are read in; the plugins it loads are not
    // worth a line.
    { ...options, lang: "en", logLevel: "Warn" },
    [new TypeDocReader(), new PackageJsonReader(), new TSConfigReader()],
  );
  if (app.logger.hasErrors()) {
    return { findings: [], errors: ["TypeDoc's options: see the log above."] };
  }
  const logger = new RecordingLogger();
  app.logger = logger;
  const project = await app.convert();
  if (project !== undefined) app.validate(project);

  // A validation warning names its file from the package's folder, the one
  // that holds the reference's tsconfig: `reforged-ts/src/...`.
  const packagePrefix = `${project?.packageName ?? project?.name ?? ""}/`;
  const packageFolder = dirname(subject.reference.tsconfig);
  const fileOf = (record: LogRecord): string | undefined => {
    if (record.fileName !== undefined) {
      return posixRelative(subject.root, record.fileName);
    }
    const path = DEFINED_IN.exec(record.message)?.groups?.path;
    if (path === undefined) return undefined;
    return path.startsWith(packagePrefix)
      ? posixRelative(
          subject.root,
          join(packageFolder, path.slice(packagePrefix.length)),
        )
      : path;
  };
  const findings: Finding[] = [];
  const errors: string[] = [];
  for (const record of logger.records) {
    const file = fileOf(record);
    const at =
      record.line === undefined
        ? {}
        : { line: record.line, column: record.column };
    if (record.level === LogLevel.Error) {
      errors.push(
        file === undefined
          ? record.message
          : `${file}${record.line === undefined ? "" : `:${String(record.line)}:${String(record.column)}`} ${record.message}`,
      );
      continue;
    }
    const undocumented = NOT_DOCUMENTED.exec(record.message)?.groups;
    findings.push(
      undocumented === undefined
        ? { source: "typedoc", file, ...at, message: record.message }
        : {
            source: "undocumented",
            file,
            message: `${undocumented.name} (${undocumented.kind})`,
          },
    );
  }
  if (project === undefined && errors.length === 0) {
    errors.push("TypeDoc converted no project.");
  }
  return { findings, errors };
}

/**
 * The doc comment rules, those of `docComments` in eslint.config.mjs: the
 * audit counts their findings alone, not the formatting or import findings
 * `pnpm lint` reports on the same files. A test checks the two lists agree.
 */
export const DOC_RULES: ReadonlySet<string> = new Set([
  "tsdoc/syntax",
  "jsdoc/require-jsdoc",
  "jsdoc/require-param",
  "jsdoc/require-returns",
  "jsdoc/sort-tags",
]);

/**
 * The messages of the doc comment rules on the linted files, and any file
 * ESLint could not parse, whose comments went unchecked.
 */
async function lintFindings(subject: AuditSubject): Promise<Finding[]> {
  const eslint = new ESLint(subject.eslint);
  const results = await eslint.lintFiles([...subject.lint]);
  return results.flatMap((result) =>
    result.messages
      .filter(
        (message) =>
          message.fatal === true ||
          (message.ruleId !== null && DOC_RULES.has(message.ruleId)),
      )
      .map((message) => ({
        source: "lint" as const,
        file: posixRelative(subject.root, result.filePath),
        line: message.line,
        column: message.column,
        rule: message.ruleId ?? "(parse)",
        message: message.message,
      })),
  );
}

/** Runs both halves of the audit on `subject`. */
export async function audit(subject: AuditSubject): Promise<AuditReport> {
  const [typedoc, lint] = await Promise.all([
    typedocFindings(subject),
    lintFindings(subject),
  ]);
  return {
    findings: [...typedoc.findings, ...lint],
    errors: typedoc.errors,
  };
}

/** The arguments of `docs:audit`. */
export interface AuditArguments {
  /** Exit 1 on any finding. */
  readonly strict: boolean;
  /** The counts per file, without the findings. */
  readonly summary: boolean;
  /**
   * Keep the files whose path is one of these or ends with `/` and one of
   * them; every file when empty.
   */
  readonly files: readonly string[];
}

const USAGE = "Usage: docs:audit [--strict] [--summary] [file ...]\n";

/** Reads the arguments, or undefined when one is unknown. */
export function parseArguments(
  args: readonly string[],
): AuditArguments | undefined {
  let strict = false;
  let summary = false;
  const files: string[] = [];
  for (const arg of args) {
    if (arg === "--strict") strict = true;
    else if (arg === "--summary") summary = true;
    else if (arg.startsWith("-")) return undefined;
    else files.push(arg.replaceAll("\\", "/").replace(/^\.\//, ""));
  }
  return { strict, summary, files };
}

/** The findings on the files the arguments keep. */
function keptFindings(
  report: AuditReport,
  args: AuditArguments,
): readonly Finding[] {
  if (args.files.length === 0) return report.findings;
  return report.findings.filter(
    ({ file }) =>
      file !== undefined &&
      args.files.some(
        (wanted) => file === wanted || file.endsWith(`/${wanted}`),
      ),
  );
}

const NO_FILE = "(no file)";

/** The findings the arguments keep, as `docs:audit` prints them. */
export function formatReport(
  findings: readonly Finding[],
  args: AuditArguments,
): string {
  const byFile = new Map<string, Finding[]>();
  for (const finding of findings) {
    const file = finding.file ?? NO_FILE;
    byFile.set(file, [...(byFile.get(file) ?? []), finding]);
  }
  const files = [...byFile].sort(
    ([a, left], [b, right]) => right.length - left.length || a.localeCompare(b),
  );
  const lines: string[] = [];
  for (const [file, fileFindings] of files) {
    lines.push(
      `${file}  ${String(fileFindings.length)}: ${counts(fileFindings)}`,
    );
    if (args.summary) continue;
    for (const finding of fileFindings) {
      lines.push(`  ${describe(finding)}`);
    }
  }
  const scope =
    args.files.length === 0 ? "" : ` (only ${args.files.join(", ")})`;
  const named = files.filter(([file]) => file !== NO_FILE).length;
  lines.push(
    `docs:audit: ${plural(findings.length, "finding")} in ${plural(named, "file")}${scope}: ${counts(findings)}.`,
  );
  if (!args.strict && findings.length !== 0) {
    lines.push("Not strict: exit code 0. --strict fails on any finding.");
  }
  return `${lines.join("\n")}\n`;
}

/** One finding, as a line of its file's list. */
function describe(finding: Finding): string {
  const at =
    finding.line === undefined
      ? ""
      : `${String(finding.line)}:${String(finding.column)} `;
  switch (finding.source) {
    case "undocumented":
      return `undocumented ${finding.message}`;
    case "typedoc":
      return `typedoc ${at}${finding.message}`;
    case "lint":
      return `lint ${at}${finding.rule ?? ""} ${finding.message}`;
  }
}

function plural(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

/** The findings of each source, as `369 undocumented, 12 lint`. */
function counts(findings: readonly Finding[]): string {
  const sources = ["undocumented", "lint", "typedoc"] as const;
  return sources
    .map(
      (source) =>
        `${String(findings.filter((finding) => finding.source === source).length)} ${source}`,
    )
    .join(", ");
}

export async function main(
  argv: readonly string[],
  output: Output,
  subject: () => AuditSubject = workspaceSubject,
): Promise<number> {
  const args = parseArguments(argv);
  if (args === undefined) {
    output.stderr(USAGE);
    return 2;
  }
  const report = await audit(subject());
  if (report.errors.length !== 0) {
    output.stderr(
      `docs:audit: TypeDoc reported ${String(report.errors.length)} error(s):\n${report.errors.map((error) => `  ${error}\n`).join("")}`,
    );
    return 1;
  }
  const findings = keptFindings(report, args);
  output.stdout(formatReport(findings, args));
  return args.strict && findings.length !== 0 ? 1 : 0;
}

/** `file` relative to `root`, POSIX slashes. */
function posixRelative(root: string, file: string): string {
  return relative(root, file).replaceAll("\\", "/");
}

const script = process.argv.at(1);
if (
  script !== undefined &&
  pathToFileURL(resolve(script)).href === import.meta.url
) {
  process.exitCode = await main(process.argv.slice(2), PROCESS_OUTPUT);
}
