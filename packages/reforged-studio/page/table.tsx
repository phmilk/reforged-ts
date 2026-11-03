/**
 * The Table mode of an Object kind (#836): one row per object and one
 * column per field, the map's objects and the changed columns by default,
 * with a toggle for every object and one for every field. A cell edits on a
 * click, as the field table does; a column's "Fill…" sets, adds to,
 * multiplies or resets it on every row that has it, as one undo step.
 */
import { useEffect, useRef, useState } from "react";
import type { ObjectKind } from "reforged-map";
import {
  columnKey,
  type SessionCounts,
  type TableAnswer,
  type TableCell,
  type TableColumn,
  type TableRow,
} from "../src/server/api-types.js";
import { api, refusalText } from "./api.js";
import { choicesOf, columnName, type BulkStart } from "./bulk.js";
import { optionText, valueOf } from "./edit.js";
import { Icon, OriginChip } from "./parts.js";

/** The input of a cell being edited: a select for an enumeration or a toggle, else a text, committed on Enter, a change or the blur. */
function CellInput(props: {
  readonly column: TableColumn;
  readonly cell: TableCell;
  readonly label: string;
  readonly onCommit: (text: string) => void;
  readonly onCancel: () => void;
}) {
  const { column, cell, label, onCommit, onCancel } = props;
  const current = cell.value === undefined ? "" : String(cell.value);
  const [draft, setDraft] = useState(current);
  // Enter, then the blur of the input going away, must commit once.
  const closed = useRef(false);
  const done = (text: string | undefined) => {
    if (closed.current) return;
    closed.current = true;
    if (text === undefined || text === current) onCancel();
    else onCommit(text);
  };
  const options = choicesOf(column);
  if (options !== undefined) {
    return (
      <select
        autoFocus
        aria-label={label}
        value={current}
        onChange={(event) => {
          done(event.target.value);
        }}
        onBlur={() => {
          done(undefined);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") done(undefined);
        }}
      >
        {!options.some((option) => option.value === current) && (
          <option value={current}>{current === "" ? "—" : current}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {optionText(option)}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      autoFocus
      aria-label={label}
      className="field-input"
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") done(event.currentTarget.value);
        if (event.key === "Escape") done(undefined);
      }}
      onBlur={(event) => {
        done(event.currentTarget.value);
      }}
    />
  );
}

/** One cell: its value shown, edited on a click when it can be, reset with ↺ when the object modifies it. */
function Cell(props: {
  readonly kind: ObjectKind;
  readonly row: TableRow;
  readonly column: TableColumn;
  readonly cell: TableCell | null;
  readonly onChanged: (counts: SessionCounts) => void;
}) {
  const { kind, row, column, cell, onChanged } = props;
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  if (cell === null) {
    return <td className="value absent" data-field={column.id} />;
  }
  const label = `${columnName(column)} of ${row.rawcode}`;
  const address = {
    kind,
    rawcode: row.rawcode,
    field: column.id,
    ...(column.level !== undefined && { level: column.level }),
  };
  const run = (change: Promise<SessionCounts>) => {
    change.then(
      (counts) => {
        setError(undefined);
        onChanged(counts);
      },
      (reason: unknown) => {
        setError(refusalText(reason));
      },
    );
  };
  const className = `value${cell.modified ? " modified" : ""}${cell.unsaved ? " unsaved" : ""}`;
  return (
    <td className={className} data-field={column.id}>
      <div className="field-line">
        {editing ? (
          <CellInput
            column={column}
            cell={cell}
            label={label}
            onCancel={() => {
              setEditing(false);
            }}
            onCommit={(text) => {
              setEditing(false);
              run(
                api.edits([
                  { op: "setField", ...address, value: valueOf(column, text) },
                ]),
              );
            }}
          />
        ) : cell.editable ? (
          <button
            type="button"
            className="edit-value"
            aria-label={`Edit ${label}`}
            onClick={() => {
              setEditing(true);
            }}
          >
            <span className="display">{cell.display ?? "—"}</span>
          </button>
        ) : (
          <span className="display">{cell.display ?? "—"}</span>
        )}
        {cell.modified && cell.editable && (
          <button
            type="button"
            className="link reset"
            aria-label={`Reset ${label}`}
            title="Reset to the base's value"
            onClick={() => {
              run(api.reset(address));
            }}
          >
            ↺
          </button>
        )}
      </div>
      {error !== undefined && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </td>
  );
}

/** The Rawcodes of the rows a column's fill edits: those that have the field and can edit it. */
function fillable(answer: TableAnswer, index: number): string[] {
  return answer.rows
    .filter((row) => row.cells[index]?.editable === true)
    .map((row) => row.rawcode);
}

/** The Table mode of one kind. */
export function TableMode(props: {
  readonly kind: ObjectKind;
  /** Whether the objects outside the map's Game data set show, the page's toggle. */
  readonly all: boolean;
  /** Bumped when the session changed, to read the table again. */
  readonly version: number;
  readonly onChanged: (counts: SessionCounts) => void;
  readonly onBulk: (start: BulkStart) => void;
  /** Opens an object's field table. */
  readonly onOpen: (row: TableRow) => void;
}) {
  const { kind, all, version, onChanged, onBulk, onOpen } = props;
  const [objects, setObjects] = useState(false);
  const [fields, setFields] = useState(false);
  const [answer, setAnswer] = useState<TableAnswer>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    api.table(kind, { objects, fields, all }).then(
      (found) => {
        if (live) {
          setAnswer(found);
          setError(undefined);
        }
      },
      (reason: unknown) => {
        if (live) setError(refusalText(reason));
      },
    );
    return () => {
      live = false;
    };
  }, [kind, objects, fields, all, version]);
  return (
    <section className="table-mode" aria-label="Table mode">
      <div className="toolbar">
        <label>
          <input
            type="checkbox"
            checked={objects}
            onChange={(event) => {
              setObjects(event.target.checked);
            }}
          />{" "}
          Show every object
        </label>
        <label>
          <input
            type="checkbox"
            checked={fields}
            onChange={(event) => {
              setFields(event.target.checked);
            }}
          />{" "}
          Show every field
        </label>
        {answer !== undefined && (
          <span className="muted">
            {answer.rows.length} objects · {answer.columns.length} fields
          </span>
        )}
      </div>
      {error !== undefined && <p className="warning">{error}</p>}
      {answer?.kind !== kind ? (
        <p className="notice muted">Reading the table…</p>
      ) : answer.rows.length === 0 ? (
        <p className="notice muted">
          The map has no object of this kind: show every object to see the
          Built-in ones.
        </p>
      ) : (
        <div className="table-scroll">
          <table className="fields table" aria-label="Objects as a table">
            <thead>
              <tr>
                <th scope="col">Object</th>
                {answer.columns.length === 0 && (
                  <th scope="col" className="muted">
                    No field changed: show every field.
                  </th>
                )}
                {answer.columns.map((column, index) => {
                  const rawcodes = fillable(answer, index);
                  return (
                    <th
                      scope="col"
                      key={columnKey(column)}
                      data-field={column.id}
                    >
                      <span className="column-name">{columnName(column)}</span>{" "}
                      <code className="raw">{column.id}</code>{" "}
                      <button
                        type="button"
                        className="link"
                        aria-label={`Fill ${columnName(column)}`}
                        title={`Set, add to, multiply or reset it on the ${String(rawcodes.length)} objects shown, as one step`}
                        disabled={rawcodes.length === 0}
                        onClick={() => {
                          onBulk({ kind, rawcodes, column });
                        }}
                      >
                        Fill…
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {answer.rows.map((row) => (
                <tr
                  key={`${row.kind}:${row.rawcode}`}
                  data-rawcode={row.rawcode}
                >
                  <th scope="row" className="object">
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        onOpen(row);
                      }}
                    >
                      <Icon path={row.icon} label={row.name ?? row.rawcode} />{" "}
                      {row.name ?? "(unnamed)"}
                    </button>{" "}
                    <code className="rawcode">{row.rawcode}</code>{" "}
                    <OriginChip object={row} />
                  </th>
                  {answer.columns.map((column, index) => (
                    <Cell
                      key={columnKey(column)}
                      kind={kind}
                      row={row}
                      column={column}
                      cell={row.cells[index] ?? null}
                      onChanged={onChanged}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
