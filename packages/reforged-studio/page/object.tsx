/**
 * One object, read-only: its header (icon, name, Rawcode, chips, base),
 * its "Differs from <base>" section, and its field table with each field's
 * label, id, display and raw values, the rows of a field of levels grouped
 * and collapsible, compared objects of its kind as extra columns, and a
 * toggle that hides the fields at their base's value. Also the pages of a
 * deep link that selects nothing: a Rawcode two kinds share, an unknown
 * one, a malformed one.
 */
import { Fragment, useState } from "react";
import type {
  FieldRow,
  ObjectDetail,
  RawcodeAnswer,
} from "../src/server/api-types.js";
import { api } from "./api.js";
import {
  go,
  Icon,
  KIND_NOUNS,
  OriginChip,
  OutsideChip,
  SharedChip,
} from "./parts.js";

/** A row's key in a field table: its field and its level. */
const rowKey = (row: FieldRow): string => `${row.id}:${String(row.level ?? 0)}`;

/** The raw value a row shows: the file's when the object modifies it, else its base's. */
function rawOf(row: FieldRow | undefined): string | undefined {
  if (row === undefined) return undefined;
  if (row.modified) return String(row.stored);
  return row.base;
}

/** A decimal number's text: `1.5`, `-2`, `.50`. */
const DECIMAL = /^\s*-?(\d+\.?\d*|\.\d+)\s*$/;

/** Whether two values are the same, as text or as the same decimal number (`1.5`, `1.50`). */
function same(value: unknown, base: string): boolean {
  const text = String(value);
  if (text === base) return true;
  return (
    DECIMAL.test(text) && DECIMAL.test(base) && Number(text) === Number(base)
  );
}

/**
 * Whether a row holds its base's value: unmodified, or modified to the
 * same value, in the working state (a `TRIGSTR_` resolved) or as the file
 * stores it.
 */
function atBase(row: FieldRow | undefined): boolean {
  if (!row?.modified) return true;
  if (row.base === undefined) return false;
  return (
    (row.value !== undefined && same(row.value, row.base)) ||
    (row.stored !== undefined && same(row.stored, row.base))
  );
}

/** One cell's value: its display value, and its raw value where the two differ; an icon field's icon. */
function Value(props: {
  readonly row: FieldRow | undefined;
  readonly owner: string;
}) {
  const { row, owner } = props;
  if (row === undefined) return <span className="muted">—</span>;
  const display = row.display;
  const raw = rawOf(row);
  if (display === undefined && raw === undefined) {
    return <span className="muted">—</span>;
  }
  return (
    <>
      {row.type === "icon" && raw !== undefined && raw !== "" && (
        <Icon path={raw} label={owner} />
      )}
      <span className="display">{display}</span>
      {raw !== undefined && raw !== display && (
        <code className="raw">{raw}</code>
      )}
    </>
  );
}

/** One cell of a column: highlighted when the object modifies the field. */
function Cell(props: {
  readonly row: FieldRow | undefined;
  readonly object: ObjectDetail;
}) {
  const { row, object } = props;
  return (
    <td
      className={`value${row?.modified === true ? " modified" : ""}`}
      title={
        row?.modified === true
          ? `Base: ${row.baseDisplay ?? row.base ?? "none"}`
          : undefined
      }
    >
      <Value row={row} owner={object.name ?? object.rawcode} />
    </td>
  );
}

/** A row's field label, its level for a field of levels. */
function label(row: FieldRow): string {
  return row.label ?? row.id;
}

/** The base an object's modifications differ from, as its section's heading names it. */
function baseName(object: ObjectDetail): string {
  if (object.base !== undefined) {
    return `${object.base.name ?? object.base.rawcode} (${object.base.rawcode})`;
  }
  return `${object.builtinName ?? "the Built-in object"} (${object.rawcode})`;
}

/** The "Differs from <base>" section: each modified field with its base's value. */
function Differs(props: { readonly object: ObjectDetail }) {
  const { object } = props;
  const modified = object.fields.filter((row) => row.modified);
  if (modified.length === 0) return null;
  return (
    <section className="differs" aria-label="Differs from base">
      <h3>
        Differs from {baseName(object)} ({modified.length})
      </h3>
      <table>
        <tbody>
          {modified.map((row) => (
            <tr key={rowKey(row)} data-field={row.id}>
              <td>
                {label(row)}
                {row.level !== undefined && (
                  <span className="muted"> · level {row.level}</span>
                )}
              </td>
              <td>
                <code>{row.id}</code>
              </td>
              <td className="value modified">
                <Value row={row} owner={object.name ?? object.rawcode} />
              </td>
              <td className="base">
                was{" "}
                {row.base === undefined ? (
                  <span className="muted">unset</span>
                ) : (
                  <>
                    <span className="display">{row.baseDisplay}</span>
                    {row.base !== row.baseDisplay && (
                      <code className="raw">{row.base}</code>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** The rows of the field table: one per field, a field of levels a group of its levels. */
type TableRow =
  | { readonly kind: "single"; readonly key: string; readonly head: FieldRow }
  | {
      readonly kind: "levels";
      readonly id: string;
      readonly head: FieldRow;
      readonly keys: readonly string[];
    };

/** The union of the columns' rows, in the selected object's order, each field's levels grouped. */
function tableRows(columns: readonly ObjectDetail[]): TableRow[] {
  const heads = new Map<string, FieldRow>();
  for (const column of columns) {
    for (const row of column.fields) {
      if (!heads.has(rowKey(row))) heads.set(rowKey(row), row);
    }
  }
  const rows: TableRow[] = [];
  const groups = new Map<string, string[]>();
  for (const [key, head] of heads) {
    if (head.level === undefined) {
      rows.push({ kind: "single", key, head });
      continue;
    }
    let keys = groups.get(head.id);
    if (keys === undefined) {
      keys = [];
      groups.set(head.id, keys);
      rows.push({ kind: "levels", id: head.id, head, keys });
    }
    keys.push(key);
  }
  return rows;
}

/** The field table of an object, compared objects as extra columns. */
function FieldTable(props: {
  readonly columns: readonly ObjectDetail[];
  readonly hideAtBase: boolean;
  readonly onUnpin: (object: ObjectDetail) => void;
}) {
  const { columns, hideAtBase, onUnpin } = props;
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const byKey = columns.map(
    (column) => new Map(column.fields.map((row) => [rowKey(row), row])),
  );
  const hidden = (key: string) =>
    hideAtBase && byKey.every((rows) => atBase(rows.get(key)));
  return (
    <table className="fields">
      <thead>
        <tr>
          <th>Field</th>
          <th>Id</th>
          {columns.map((column, i) => (
            <th key={`${column.kind}:${column.rawcode}`}>
              {i === 0 ? (
                "Value"
              ) : (
                <>
                  <button
                    type="button"
                    className="link"
                    onClick={() => {
                      go({ rawcode: column.rawcode, kind: column.kind });
                    }}
                  >
                    {column.name ?? "(unnamed)"} <code>{column.rawcode}</code>
                  </button>{" "}
                  <button
                    type="button"
                    className="link"
                    aria-label={`Stop comparing ${column.rawcode}`}
                    onClick={() => {
                      onUnpin(column);
                    }}
                  >
                    ✕
                  </button>
                </>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableRows(columns).map((row) => {
          if (row.kind === "single") {
            if (hidden(row.key)) return null;
            return (
              <tr key={row.key} data-field={row.head.id}>
                <td>{label(row.head)}</td>
                <td>
                  <code>{row.head.id}</code>
                </td>
                {columns.map((column, i) => (
                  <Cell
                    key={`${column.kind}:${column.rawcode}`}
                    row={byKey[i]?.get(row.key)}
                    object={column}
                  />
                ))}
              </tr>
            );
          }
          const shown = row.keys.filter((key) => !hidden(key));
          if (shown.length === 0) return null;
          const open = !collapsed.has(row.id);
          return (
            <Fragment key={row.id}>
              <tr className="levels" data-field={row.id}>
                <td>
                  <button
                    type="button"
                    className="link"
                    aria-expanded={open}
                    onClick={() => {
                      const next = new Set(collapsed);
                      if (open) next.add(row.id);
                      else next.delete(row.id);
                      setCollapsed(next);
                    }}
                  >
                    {open ? "▾" : "▸"} {label(row.head)}
                  </button>{" "}
                  <span className="muted">· {row.keys.length} levels</span>
                </td>
                <td>
                  <code>{row.id}</code>
                </td>
                {columns.map((column, i) => (
                  <td
                    key={`${column.kind}:${column.rawcode}`}
                    className="muted"
                  >
                    {row.keys
                      .map((key) => byKey[i]?.get(key)?.display ?? "—")
                      .join(", ")}
                  </td>
                ))}
              </tr>
              {open &&
                shown.map((key) => (
                  <tr key={key} className="level" data-field={row.id}>
                    <td className="level-label">
                      Level {byKey[0]?.get(key)?.level ?? key.split(":")[1]}
                    </td>
                    <td>
                      <code>{row.id}</code>
                    </td>
                    {columns.map((column, i) => (
                      <Cell
                        key={`${column.kind}:${column.rawcode}`}
                        row={byKey[i]?.get(key)}
                        object={column}
                      />
                    ))}
                  </tr>
                ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

/** The selected object: its header, its "Differs from" section and its field table. */
export function ObjectPage(props: {
  readonly answer: Extract<
    RawcodeAnswer,
    { status: "known" | "not-in-game-data-set" }
  >;
  readonly selected: ObjectDetail;
  readonly compared: readonly ObjectDetail[];
  readonly pinned: boolean;
  readonly onPin: () => void;
  readonly onUnpin: (object: ObjectDetail) => void;
}) {
  const { answer, selected, compared, pinned, onPin, onUnpin } = props;
  const [hideAtBase, setHideAtBase] = useState(false);
  const others = answer.objects
    .filter((object) => object.kind !== selected.kind)
    .map((object) => object.kind);
  return (
    <article className="object">
      <header className="object-header">
        <Icon
          path={selected.icon}
          label={selected.name ?? selected.rawcode}
          size="large"
        />
        <div className="grow">
          <h2>
            {selected.name ?? "(unnamed)"} <code>{selected.rawcode}</code>{" "}
            <OriginChip object={selected} />{" "}
            <SharedChip object={selected} others={others} />{" "}
            <OutsideChip object={selected} />
          </h2>
          <p className="muted">
            {selected.base !== undefined && (
              <>
                Based on{" "}
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    if (selected.base !== undefined) {
                      go({
                        rawcode: selected.base.rawcode,
                        kind: selected.kind,
                      });
                    }
                  }}
                >
                  {selected.base.name ?? selected.base.rawcode} (
                  <code>{selected.base.rawcode}</code>)
                </button>
                .{" "}
              </>
            )}
            {selected.readOnly !== undefined && (
              <>
                Read-only: defined in {selected.readOnly.path}, line{" "}
                {selected.readOnly.line}.{" "}
                <button
                  type="button"
                  onClick={() => {
                    void api.openInEditor(selected.kind, selected.rawcode);
                  }}
                >
                  Open in editor
                </button>
              </>
            )}
          </p>
          {answer.status === "not-in-game-data-set" && (
            <p className="warning">
              Not in this map&apos;s Game data set, {answer.gameDataSet.label}.
            </p>
          )}
        </div>
        <button type="button" onClick={onPin} aria-pressed={pinned}>
          {pinned ? "Stop comparing" : "Compare"}
        </button>
      </header>
      <Differs object={selected} />
      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            checked={hideAtBase}
            onChange={(event) => {
              setHideAtBase(event.target.checked);
            }}
          />{" "}
          Hide fields at their base&apos;s value
        </label>
        {compared.length > 0 && (
          <span className="muted">Comparing {compared.length + 1} objects</span>
        )}
      </div>
      <FieldTable
        columns={[selected, ...compared]}
        hideAtBase={hideAtBase}
        onUnpin={onUnpin}
      />
    </article>
  );
}

/** The page of a deep link that selects no object: a shared Rawcode, an unknown one, a malformed one. */
export function NoSelection(props: { readonly answer: RawcodeAnswer }) {
  const { answer } = props;
  if (answer.status === "malformed") {
    return (
      <p className="notice">
        <code>{answer.rawcode}</code> is not a Rawcode: a Rawcode is four
        printable characters.
      </p>
    );
  }
  if (answer.status === "unknown") {
    return (
      <div className="notice">
        <p>
          <code>{answer.rawcode}</code> is neither in this map nor Built-in.
        </p>
        {answer.suggestions.length > 0 && (
          <>
            <p>Did you mean, one edit away:</p>
            <ul className="choices">
              {answer.suggestions.map((suggestion) => (
                <li key={`${suggestion.kind}:${suggestion.rawcode}`}>
                  <button
                    type="button"
                    onClick={() => {
                      go({
                        rawcode: suggestion.rawcode,
                        kind: suggestion.kind,
                      });
                    }}
                  >
                    {suggestion.name ?? suggestion.rawcode}{" "}
                    <code>{suggestion.rawcode}</code>,{" "}
                    {KIND_NOUNS[suggestion.kind]}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="notice">
      <p>
        <code>{answer.rawcode}</code> names an object of {answer.objects.length}{" "}
        Object kinds:{" "}
        {answer.objects.map((object) => KIND_NOUNS[object.kind]).join(" and ")}.
        Choose one.
      </p>
      <p className="muted">
        <code>FourCC(&quot;{answer.rawcode}&quot;)</code> has no typed overload
        for it: the Rawcode alone does not say which kind it names.
      </p>
      <ul className="choices">
        {answer.objects.map((object) => (
          <li key={`${object.kind}:${object.rawcode}`}>
            <button
              type="button"
              onClick={() => {
                go({ rawcode: object.rawcode, kind: object.kind });
              }}
            >
              <Icon path={object.icon} label={object.name ?? object.rawcode} />{" "}
              {object.name ?? "(unnamed)"}, {KIND_NOUNS[object.kind]}{" "}
              <OriginChip object={object} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
