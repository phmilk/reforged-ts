/**
 * Bulk editing (#836): the Table mode of one Object kind, one row per
 * object and one column per field, read from each object's field table;
 * and the edits of one field on a selection of objects, set, added to,
 * multiplied or reset, which the session applies as one undo step.
 */
import type { ObjectKind } from "reforged-map";
import {
  columnKey,
  type BulkRequest,
  type Edit,
  type FieldRow,
  type ListedObject,
  type ResetRequest,
  type TableAnswer,
  type TableCell,
  type TableColumn,
} from "./api-types.js";
import { detailOf, type DetailSources } from "./objects.js";

/** A bulk edit refused before the session sees it, with its HTTP status. */
export class BulkRefusedError extends Error {
  override name = "BulkRefusedError";

  /**
   * @param status - The HTTP status of the refusal.
   * @param reason - The refusal's reason, as the API names it.
   * @param message - The message an author reads.
   */
  constructor(
    readonly status: number,
    readonly reason: string,
    message: string,
  ) {
    super(message);
  }
}

/** A field's name in a message: its id, with its level for a field of levels. */
const fieldName = (field: string, level: number | undefined): string =>
  level === undefined ? field : `${field} (level ${String(level)})`;

/** The value a row's edit starts from: the working state's, else its base's. */
const currentOf = (row: FieldRow): number | string | undefined =>
  row.value ?? row.base;

/** The inputs of a number, which `"add"` and `"multiply"` take. */
const NUMBER_INPUTS: ReadonlySet<FieldRow["input"]> = new Set([
  "integer",
  "real",
]);

/**
 * A number computed for a field of a value type: an integer rounded to a
 * whole number, a real to the 7 significant digits its 32-bit float holds,
 * so that `0.1 + 0.2` gives `0.3`.
 */
function rounded(value: number, valueType: FieldRow["valueType"]): number {
  return valueType === "int" ? Math.round(value) : Number(value.toPrecision(7));
}

/** What a bulk edit is computed from. */
export interface BulkSources {
  /** The objects of the selection, found in the Studio's objects, in the request's order. */
  readonly objects: readonly ListedObject[];
  /** What each object's field table is read from. */
  readonly details: DetailSources;
  /** The edits that reset a field of an object, the session's. */
  readonly resetEdits: (
    target: ResetRequest & { readonly field: string },
  ) => Edit[];
}

/**
 * The edits of one bulk edit, one per object of the selection but those a
 * reset leaves as they are: each to pass, together, to the session as one
 * undo step. Whether the editor takes each value, and whether the code owns
 * an object, is the session's to check.
 *
 * @param request - The bulk edit.
 * @param sources - The selection's objects and their field tables.
 * @returns The edits, in the selection's order.
 * @throws {@link BulkRefusedError} With the reason `"not-numeric"` when
 *   `"add"` or `"multiply"` names a field that is no number, `"no-field"`
 *   when an object's field table has no such field and `"no-value"` when an
 *   object holds no number in it, naming those objects.
 */
export function bulkEdits(request: BulkRequest, sources: BulkSources): Edit[] {
  const { op, kind, field, level, dataPointer, value } = request;
  const address = {
    kind,
    field,
    ...(level !== undefined && { level }),
    ...(dataPointer !== undefined && { dataPointer }),
  };
  if (op === "reset") {
    return sources.objects.flatMap((object) =>
      sources.resetEdits({ ...address, rawcode: object.rawcode }),
    );
  }
  if (op === "set") {
    return sources.objects.map((object) => ({
      op: "setField",
      ...address,
      rawcode: object.rawcode,
      value: value ?? "",
    }));
  }
  const operand = Number(value);
  const edits: Edit[] = [];
  const fieldless: string[] = [];
  const valueless: string[] = [];
  for (const object of sources.objects) {
    // A row has no data pointer: in a field table, a field and a level name it.
    const row = detailOf(object, sources.details).fields.find(
      (candidate) => candidate.id === field && candidate.level === level,
    );
    if (row === undefined) {
      fieldless.push(object.rawcode);
      continue;
    }
    if (!NUMBER_INPUTS.has(row.input)) {
      throw new BulkRefusedError(
        422,
        "not-numeric",
        `${fieldName(field, level)} is no number field: ${op === "add" ? "add to" : "multiply"} a field that holds a number.`,
      );
    }
    const current = currentOf(row);
    const number = current === undefined ? Number.NaN : Number(current);
    if (current === "" || !Number.isFinite(number)) {
      valueless.push(object.rawcode);
      continue;
    }
    edits.push({
      op: "setField",
      ...address,
      rawcode: object.rawcode,
      value: rounded(
        op === "add" ? number + operand : number * operand,
        row.valueType,
      ),
    });
  }
  const list = (rawcodes: readonly string[]) =>
    `${rawcodes.join(", ")} ${rawcodes.length === 1 ? "has" : "have"}`;
  if (fieldless.length > 0) {
    throw new BulkRefusedError(
      422,
      "no-field",
      `${list(fieldless)} no field ${fieldName(field, level)}: its kind or its base does not give it.`,
    );
  }
  if (valueless.length > 0) {
    throw new BulkRefusedError(
      422,
      "no-value",
      `${list(valueless)} no number in ${fieldName(field, level)}, nor does the base: set it first.`,
    );
  }
  return edits;
}

/**
 * One Object kind's Table mode: one row per object, one column per field
 * of their field tables, in the order of the kind's fields; with
 * `allFields` false, only the columns a row modifies or an unsaved edit
 * changed.
 *
 * @param kind - The Object kind.
 * @param objects - The rows' objects, in the tree's order.
 * @param sources - What each object's field table is read from.
 * @param allFields - Whether every column shows.
 * @returns The table.
 */
export function tableOf(
  kind: ObjectKind,
  objects: readonly ListedObject[],
  sources: DetailSources,
  allFields: boolean,
): TableAnswer {
  const details = objects.map((object) => detailOf(object, sources));
  const columns = new Map<string, { column: TableColumn; changed: boolean }>();
  for (const detail of details) {
    for (const row of detail.fields) {
      const key = columnKey(row);
      const known = columns.get(key);
      const changed = row.modified || row.unsaved;
      if (known === undefined) {
        columns.set(key, { column: columnOf(row), changed });
        continue;
      }
      if (changed) known.changed = true;
      if (known.column.input === undefined && row.input !== undefined) {
        known.column = columnOf(row);
      }
    }
  }
  const shown = [...columns.entries()].filter(
    ([, entry]) => allFields || entry.changed,
  );
  return {
    kind,
    columns: shown.map(([, entry]) => entry.column),
    // A row is the listed object with its cells: an Object definition's
    // file and line stay its field table's.
    rows: details.map(({ fields }, index) => {
      const byKey = new Map(fields.map((row) => [columnKey(row), row]));
      return {
        ...objects[index],
        cells: shown.map(([key]) => {
          const row = byKey.get(key);
          return row === undefined ? null : cellOf(row);
        }),
      };
    }),
  };
}

/** A column's head, from a row of its field. */
function columnOf(row: FieldRow): TableColumn {
  return {
    id: row.id,
    ...(row.label !== undefined && { label: row.label }),
    ...(row.category !== undefined && { category: row.category }),
    ...(row.level !== undefined && { level: row.level }),
    ...(row.input !== undefined && { input: row.input }),
    ...(row.valueType !== undefined && { valueType: row.valueType }),
    ...(row.options !== undefined && { options: row.options }),
  };
}

/** A cell, from an object's row of its field. */
function cellOf(row: FieldRow): TableCell {
  const value = currentOf(row);
  return {
    ...(row.display !== undefined && { display: row.display }),
    ...(value !== undefined && { value }),
    modified: row.modified,
    unsaved: row.unsaved,
    editable: row.input !== undefined,
  };
}
