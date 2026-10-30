/**
 * Editing in the Studio (#834): a field's inline input by its type (a
 * number, a text, an enumeration as a select, a toggle, a Rawcode list as
 * linked chips, an icon with its picker), its reset, the refusal shown on
 * the field, a localizable field's translations read-only; and the diff of
 * the unsaved changes and of the changes since the last commit.
 */
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { DiffAnswer, FieldRow } from "../src/server/api-types.js";
import { api, ApiError } from "./api.js";
import { go, Icon } from "./parts.js";

/** What a field editor does: sets the value, or puts the field back to its base. */
export interface FieldActions {
  /** Sets the field's value; rejects with the editor's refusal. */
  readonly set: (value: number | string) => Promise<void>;
  /** Puts the field back to its base's value. */
  readonly reset: () => Promise<void>;
}

/** The raw value a row holds now: its working value, else its base's. */
function rawValue(row: FieldRow): string {
  if (row.value !== undefined) return String(row.value);
  return row.base ?? "";
}

/**
 * The value an edit sends for a text typed in a row's input: a number for a
 * field that stores one when the text is one, else the text as typed, so
 * that the editor refuses it with its own reason.
 */
function valueOf(row: FieldRow, text: string): number | string {
  if (row.valueType === "int" && /^\s*-?\d+\s*$/.test(text)) {
    return Number(text);
  }
  if (
    (row.valueType === "real" || row.valueType === "unreal") &&
    text.trim() !== "" &&
    Number.isFinite(Number(text))
  ) {
    return Number(text);
  }
  return text;
}

/** A select option's text: `Heavy (large)`, its raw value alone when it has no label. */
const optionText = (option: { value: string; label?: string }): string =>
  option.label === undefined || option.label === option.value
    ? option.value
    : `${option.label} (${option.value})`;

/** The text input of a number or a text: shown as its value until clicked, committed on Enter or blur. */
function TextInput(props: {
  readonly row: FieldRow;
  readonly label: string;
  readonly commit: (text: string) => void;
}) {
  const { row, label, commit } = props;
  const [draft, setDraft] = useState<string>();
  // Whether the open input was already committed or cancelled: Enter, then
  // the blur of the input going away, must commit once.
  const closed = useRef(false);
  if (draft === undefined) {
    return (
      <button
        type="button"
        className="edit-value"
        aria-label={`Edit ${label}`}
        onClick={() => {
          closed.current = false;
          setDraft(rawValue(row));
        }}
      >
        <span className="display">{row.display ?? "—"}</span>
        {row.stored !== undefined && String(row.stored) !== row.display && (
          <code className="raw">{String(row.stored)}</code>
        )}
      </button>
    );
  }
  const done = (text: string | undefined) => {
    if (closed.current) return;
    closed.current = true;
    setDraft(undefined);
    if (text !== undefined && text !== rawValue(row)) commit(text);
  };
  const keydown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") done(event.currentTarget.value);
    if (event.key === "Escape") done(undefined);
  };
  return (
    <input
      autoFocus
      aria-label={label}
      className="field-input"
      inputMode={
        row.input === "integer"
          ? "numeric"
          : row.input === "real"
            ? "decimal"
            : undefined
      }
      value={draft}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
      onKeyDown={keydown}
      onBlur={(event) => {
        done(event.currentTarget.value);
      }}
    />
  );
}

/** A Rawcode list as chips, each linking to its object, with a remove button and an input that adds one. */
function RawcodeChips(props: {
  readonly row: FieldRow;
  readonly label: string;
  readonly commit: (text: string) => void;
}) {
  const { row, label, commit } = props;
  const references = row.references ?? [];
  const [adding, setAdding] = useState("");
  const list = references.map((reference) => reference.rawcode);
  return (
    <span className="chips">
      {references.map((reference, index) => (
        <span
          className="chip reference"
          key={`${reference.rawcode}:${String(index)}`}
        >
          <button
            type="button"
            className="link"
            disabled={reference.kind === undefined}
            onClick={() => {
              go({ rawcode: reference.rawcode, kind: reference.kind });
            }}
          >
            {reference.name ?? "?"} <code>{reference.rawcode}</code>
          </button>
          <button
            type="button"
            className="link"
            aria-label={`Remove ${reference.rawcode} from ${label}`}
            onClick={() => {
              commit(list.filter((_, at) => at !== index).join(","));
            }}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        className="chip-input"
        aria-label={`Add a Rawcode to ${label}`}
        placeholder="+ Rawcode"
        maxLength={4}
        value={adding}
        onChange={(event) => {
          setAdding(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || adding.trim() === "") return;
          commit([...list, adding.trim()].join(","));
          setAdding("");
        }}
      />
    </span>
  );
}

/** The icon picker: the icons the objects use, filtered, or a path typed. */
export function IconPicker(props: {
  readonly current: string;
  readonly onPick: (path: string) => void;
  readonly onClose: () => void;
}) {
  const { current, onPick, onClose } = props;
  const [icons, setIcons] = useState<readonly string[]>();
  const [filter, setFilter] = useState("");
  const [typed, setTyped] = useState(current);
  useEffect(() => {
    api.icons().then(
      (answer) => {
        setIcons(answer.icons);
      },
      () => {
        setIcons([]);
      },
    );
  }, []);
  const shown = (icons ?? [])
    .filter((icon) => icon.toLowerCase().includes(filter.toLowerCase()))
    .slice(0, 120);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an icon"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog icon-picker">
        <header>
          <h3>Choose an icon</h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <input
          autoFocus
          aria-label="Filter the icons"
          placeholder="Filter by path"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
          }}
        />
        {icons === undefined ? (
          <p className="muted">Reading the icons…</p>
        ) : (
          <ul className="icon-grid">
            {shown.map((icon) => (
              <li key={icon}>
                <button
                  type="button"
                  title={icon}
                  aria-pressed={icon === current}
                  onClick={() => {
                    onPick(icon);
                  }}
                >
                  <Icon path={icon} label={icon} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="icon-path"
          onSubmit={(event) => {
            event.preventDefault();
            if (typed.trim() !== "") onPick(typed.trim());
          }}
        >
          <input
            aria-label="Icon path"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
            }}
          />
          <button type="submit">Use this path</button>
        </form>
      </div>
    </div>
  );
}

/**
 * A field's inline editor, by its input, with its reset when the object
 * modifies it, the editor's refusal shown on it, and a localizable field's
 * translations, read-only.
 */
export function FieldEditor(props: {
  readonly row: FieldRow;
  readonly owner: string;
  readonly actions: FieldActions;
}) {
  const { row, owner, actions } = props;
  const [error, setError] = useState<string>();
  const [picking, setPicking] = useState(false);
  const label = `${row.label ?? row.id}${row.level === undefined ? "" : ` level ${String(row.level)}`}`;
  const run = (action: () => Promise<void>) => {
    action().then(
      () => {
        setError(undefined);
      },
      (reason: unknown) => {
        setError(
          reason instanceof ApiError
            ? `${reason.message} (${reason.reason})`
            : String(reason),
        );
      },
    );
  };
  const commit = (text: string) => {
    run(() => actions.set(valueOf(row, text)));
  };
  let input;
  switch (row.input) {
    case "toggle":
      input = (
        <label className="toggle">
          <input
            type="checkbox"
            aria-label={label}
            checked={rawValue(row) === "1"}
            onChange={(event) => {
              run(() => actions.set(event.target.checked ? 1 : 0));
            }}
          />{" "}
          {rawValue(row) === "1" ? "True" : "False"}
        </label>
      );
      break;
    case "select": {
      const options = row.options ?? [];
      const current = rawValue(row);
      input = (
        <select
          aria-label={label}
          value={current}
          onChange={(event) => {
            commit(event.target.value);
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
      break;
    }
    case "rawcodes":
      input = <RawcodeChips row={row} label={label} commit={commit} />;
      break;
    case "icon": {
      const current = rawValue(row);
      input = (
        <span className="icon-field">
          {current !== "" && <Icon path={current} label={owner} />}
          <code className="raw">{current === "" ? "—" : current}</code>
          <button
            type="button"
            onClick={() => {
              setPicking(true);
            }}
          >
            Choose…
          </button>
          {picking && (
            <IconPicker
              current={current}
              onPick={(path) => {
                setPicking(false);
                commit(path);
              }}
              onClose={() => {
                setPicking(false);
              }}
            />
          )}
        </span>
      );
      break;
    }
    default:
      input = <TextInput row={row} label={label} commit={commit} />;
  }
  return (
    <div className="field-editor">
      <div className="field-line">
        {input}
        {row.modified && (
          <button
            type="button"
            className="link reset"
            title={`Reset to the base's value${row.baseDisplay === undefined ? "" : `, ${row.baseDisplay}`}`}
            aria-label={`Reset ${label}`}
            onClick={() => {
              run(actions.reset);
            }}
          >
            ↺
          </button>
        )}
      </div>
      {row.translations !== undefined &&
        Object.keys(row.translations).length > 0 && (
          <dl className="translations" aria-label={`Translations of ${label}`}>
            {Object.entries(row.translations).map(([locale, text]) => (
              <div key={locale}>
                <dt>{locale}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        )}
      {error !== undefined && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** The diff of the unsaved changes, or of the changes since the last commit, as `git diff` shows it with the textconv driver. */
export function DiffDialog(props: { readonly onClose: () => void }) {
  const { onClose } = props;
  const [against, setAgainst] = useState<"saved" | "head">("saved");
  const [answer, setAnswer] = useState<DiffAnswer>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    setAnswer(undefined);
    api.diff(against).then(
      (found) => {
        if (live) setAnswer(found);
      },
      (reason: unknown) => {
        if (live) setError(String(reason));
      },
    );
    return () => {
      live = false;
    };
  }, [against]);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Diff"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog diff">
        <header>
          <div role="tablist" aria-label="Compare with">
            <button
              type="button"
              role="tab"
              aria-selected={against === "saved"}
              onClick={() => {
                setAgainst("saved");
              }}
            >
              Unsaved changes
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={against === "head"}
              onClick={() => {
                setAgainst("head");
              }}
            >
              Since the last commit
            </button>
          </div>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        {error !== undefined && <p className="warning">{error}</p>}
        {answer === undefined ? (
          <p className="muted">Reading…</p>
        ) : !answer.available ? (
          <p className="muted">{answer.reason}</p>
        ) : answer.files.length === 0 ? (
          <p className="muted">
            {against === "saved"
              ? "No unsaved change."
              : "No change since the last commit."}
          </p>
        ) : (
          answer.files.map((file) => (
            <section key={file.file} className="diff-file">
              <h4>{file.file}</h4>
              <pre>
                {file.diff.split("\n").map((line, index) => (
                  <span
                    key={index}
                    className={
                      line.startsWith("+") && !line.startsWith("+++")
                        ? "added"
                        : line.startsWith("-") && !line.startsWith("---")
                          ? "removed"
                          : line.startsWith("@@")
                            ? "hunk"
                            : undefined
                    }
                  >
                    {line}
                    {"\n"}
                  </span>
                ))}
              </pre>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
