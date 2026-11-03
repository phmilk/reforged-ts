/**
 * Bulk editing in the Studio (#836): the dialog that sets, adds to,
 * multiplies or resets one field on a selection of objects, as one undo
 * step, from the tree's selection or a column of the Table mode.
 */
import { useEffect, useState } from "react";
import type { ObjectKind } from "reforged-map";
import {
  columnKey,
  isNumericOperation,
  type BulkAnswer,
  type BulkOperation,
  type TableColumn,
} from "../src/server/api-types.js";
import { api, refusalText } from "./api.js";
import { optionText, valueOf } from "./edit.js";

/** The operations, as the dialog names them. */
const OPERATIONS: readonly (readonly [BulkOperation, string])[] = [
  ["set", "Set to"],
  ["add", "Add"],
  ["multiply", "Multiply by"],
  ["reset", "Reset to base"],
];

/** A column's name: its label, its level for a field of levels, and its id. */
export function columnName(column: TableColumn): string {
  const level =
    column.level === undefined ? "" : ` (level ${String(column.level)})`;
  return `${column.label ?? column.id}${level}`;
}

/** Whether a column holds numbers, which add and multiply take. */
const numeric = (column: TableColumn | undefined): boolean =>
  column?.input === "integer" || column?.input === "real";

/** The values a select offers for a column: an enumeration's, or a toggle's two; undefined for any other input. */
export function choicesOf(
  column: TableColumn | undefined,
): readonly { readonly value: string; readonly label?: string }[] | undefined {
  if (column?.input === "toggle") {
    return [
      { value: "1", label: "True" },
      { value: "0", label: "False" },
    ];
  }
  return column?.input === "select" ? (column.options ?? []) : undefined;
}

/** What a bulk edit is started with. */
export interface BulkStart {
  /** The objects' Object kind. */
  readonly kind: ObjectKind;
  /** The selection's Rawcodes. */
  readonly rawcodes: readonly string[];
  /** The one column it edits, a column of the Table mode; the dialog offers the fields of the first object when left out. */
  readonly column?: TableColumn;
}

/** The value input of `"set"`: a select of an enumeration's or a toggle's values, else a text. */
function SetValue(props: {
  readonly column: TableColumn | undefined;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const { column, value, onChange } = props;
  const options = choicesOf(column);
  if (options !== undefined) {
    return (
      <select
        aria-label="Value"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        <option value="">—</option>
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
      aria-label="Value"
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
}

/** The dialog of a bulk edit: the field, the operation and its value, applied to the whole selection as one undo step. */
export function BulkDialog(props: {
  readonly start: BulkStart;
  readonly onClose: () => void;
  readonly onDone: (answer: BulkAnswer) => void;
}) {
  const { start, onClose, onDone } = props;
  const { kind, rawcodes } = start;
  const [columns, setColumns] = useState<readonly TableColumn[] | undefined>(
    start.column === undefined ? undefined : [start.column],
  );
  const [chosen, setChosen] = useState<string>(
    start.column === undefined ? "" : columnKey(start.column),
  );
  const [op, setOp] = useState<BulkOperation>("set");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string>();
  const first = rawcodes.at(0);
  useEffect(() => {
    // A dialog without a selection has no field to offer.
    if (start.column !== undefined || first === undefined) return;
    let live = true;
    // The fields the first object's field table gives, editable ones only.
    api.rawcode(first, kind).then(
      (answer) => {
        if (!live) return;
        const selected =
          answer.status === "known" || answer.status === "not-in-game-data-set"
            ? answer.selected
            : undefined;
        const fields = (selected?.fields ?? []).filter(
          (row) => row.input !== undefined,
        );
        setColumns(fields);
        if (fields.length > 0) setChosen(columnKey(fields[0]));
      },
      (reason: unknown) => {
        if (live) setError(String(reason));
      },
    );
    return () => {
      live = false;
    };
  }, [start.column, first, kind]);
  const column = columns?.find((candidate) => columnKey(candidate) === chosen);
  const apply = () => {
    if (column === undefined) return;
    const typed =
      op === "reset"
        ? undefined
        : op === "set"
          ? valueOf(column, value)
          : Number(value);
    api
      .bulk({
        op,
        kind,
        rawcodes,
        field: column.id,
        ...(column.level !== undefined && { level: column.level }),
        ...(typed !== undefined && { value: typed }),
      })
      .then(onDone, (reason: unknown) => {
        setError(refusalText(reason));
      });
  };
  const needsNumber = isNumericOperation(op);
  const ready =
    column !== undefined &&
    (op === "reset" ||
      (needsNumber
        ? value.trim() !== "" && Number.isFinite(Number(value))
        : true));
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Bulk edit"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <form
        className="dialog bulk"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) apply();
        }}
      >
        <header>
          <h3>
            Edit {rawcodes.length}{" "}
            {rawcodes.length === 1 ? "object" : "objects"} at once
          </h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="muted">
          {rawcodes.join(", ")}: one step, which one undo takes back.
        </p>
        <label>
          Field{" "}
          {columns === undefined ? (
            <span className="muted">Reading the fields…</span>
          ) : (
            <select
              aria-label="Field"
              value={chosen}
              disabled={start.column !== undefined}
              onChange={(event) => {
                const next = columns.find(
                  (candidate) => columnKey(candidate) === event.target.value,
                );
                setChosen(event.target.value);
                setValue("");
                if (!numeric(next) && isNumericOperation(op)) {
                  setOp("set");
                }
              }}
            >
              {columns.map((candidate) => (
                <option key={columnKey(candidate)} value={columnKey(candidate)}>
                  {columnName(candidate)} · {candidate.id}
                </option>
              ))}
            </select>
          )}
        </label>
        <fieldset className="operations">
          <legend>Operation</legend>
          {OPERATIONS.map(([id, label]) => (
            <label key={id}>
              <input
                type="radio"
                name="operation"
                value={id}
                checked={op === id}
                disabled={isNumericOperation(id) && !numeric(column)}
                onChange={() => {
                  setOp(id);
                }}
              />{" "}
              {label}
            </label>
          ))}
        </fieldset>
        {op === "set" && (
          <SetValue column={column} value={value} onChange={setValue} />
        )}
        {needsNumber && (
          <input
            aria-label="Number"
            inputMode="decimal"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
            }}
          />
        )}
        {error !== undefined && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>{" "}
          <button type="submit" className="primary" disabled={!ready}>
            Apply
          </button>
        </footer>
      </form>
    </div>
  );
}
