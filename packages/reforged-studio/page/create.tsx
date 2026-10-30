/**
 * Creating and deleting objects (#835): the dialog of a new object, based
 * on a Built-in object or copying a Custom object, its Rawcode suggested
 * free across the seven Object kinds and checked live as the author edits
 * it; and the confirmation of a delete, listing the objects that name the
 * object and how many times it is placed on the terrain.
 */
import { useEffect, useState } from "react";
import type { ObjectKind } from "reforged-map";
import type {
  CreateAnswer,
  DeleteAnswer,
  DeletionAnswer,
  ListedObject,
  RawcodeCheckAnswer,
} from "../src/server/api-types.js";
import { api } from "./api.js";
import { go, KIND_NOUNS, KINDS } from "./parts.js";

/** What a new object's dialog starts from. */
export interface CreateStart {
  readonly kind: ObjectKind;
  /** A Rawcode the author chose, such as an unknown one a link named. */
  readonly rawcode?: string;
  /** The Built-in object to base it on. */
  readonly base?: string;
  /** The Custom object to copy. */
  readonly copyOf?: string;
}

/** An object as an option names it: its name, then its Rawcode. */
const optionText = (object: ListedObject): string =>
  `${object.name ?? "(unnamed)"} (${object.rawcode})`;

/** The text of a refusal. */
const messageOf = (reason: unknown): string =>
  reason instanceof Error ? reason.message : String(reason);

/** The dialog of a new object. */
export function CreateDialog(props: {
  readonly start: CreateStart;
  readonly onClose: () => void;
  readonly onCreated: (answer: CreateAnswer) => void;
}) {
  const { start, onClose, onCreated } = props;
  const [kind, setKind] = useState<ObjectKind>(start.kind);
  const [mode, setMode] = useState<"base" | "copy">(
    start.copyOf === undefined ? "base" : "copy",
  );
  const [base, setBase] = useState(start.base ?? "");
  const [copyOf, setCopyOf] = useState(start.copyOf ?? "");
  const [rawcode, setRawcode] = useState(start.rawcode ?? "");
  // Whether the author chose the Rawcode, which a new suggestion then keeps.
  const [chosen, setChosen] = useState(start.rawcode !== undefined);
  const [objects, setObjects] = useState<readonly ListedObject[]>();
  const [check, setCheck] = useState<RawcodeCheckAnswer>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let live = true;
    setObjects(undefined);
    api.objects(kind, true).then(
      (answer) => {
        if (live) setObjects(answer.objects);
      },
      (reason: unknown) => {
        if (live) setError(messageOf(reason));
      },
    );
    return () => {
      live = false;
    };
  }, [kind]);

  const bases = (objects ?? []).filter(
    (object) => object.origin === "builtin" || object.origin === "modified",
  );
  const customs = (objects ?? []).filter(
    (object) => object.origin === "custom",
  );
  // A base or a copy of this kind, else the first one the kind has.
  const from =
    mode === "base"
      ? bases.some((object) => object.rawcode === base)
        ? base
        : (bases[0]?.rawcode ?? "")
      : customs.some((object) => object.rawcode === copyOf)
        ? copyOf
        : (customs[0]?.rawcode ?? "");

  useEffect(() => {
    if (chosen || objects === undefined) return;
    let live = true;
    api
      .freeRawcode(kind, mode === "base" ? { base: from } : { copyOf: from })
      .then(
        (answer) => {
          if (live) setRawcode(answer.rawcode ?? "");
        },
        (reason: unknown) => {
          if (live) setError(messageOf(reason));
        },
      );
    return () => {
      live = false;
    };
  }, [kind, mode, from, chosen, objects]);

  useEffect(() => {
    let live = true;
    setCheck(undefined);
    api.rawcodeCheck(rawcode).then(
      (answer) => {
        if (live) setCheck(answer);
      },
      (reason: unknown) => {
        if (live) setError(messageOf(reason));
      },
    );
    return () => {
      live = false;
    };
  }, [rawcode]);

  const create = () => {
    api
      .create({
        kind,
        rawcode,
        ...(mode === "base" ? { base: from } : { copyOf: from }),
      })
      .then(onCreated, (reason: unknown) => {
        setError(messageOf(reason));
      });
  };
  const ready =
    check?.free === true && check.rawcode === rawcode && from !== "";

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="New object"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <form
        className="dialog create"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) create();
        }}
      >
        <header>
          <h3>New object</h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <label>
          Object kind{" "}
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as ObjectKind);
            }}
          >
            {KINDS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Start from</legend>
          <label>
            <input
              type="radio"
              name="from"
              checked={mode === "base"}
              onChange={() => {
                setMode("base");
              }}
            />{" "}
            A Built-in object
          </label>{" "}
          <label>
            <input
              type="radio"
              name="from"
              checked={mode === "copy"}
              disabled={objects !== undefined && customs.length === 0}
              onChange={() => {
                setMode("copy");
              }}
            />{" "}
            A copy of a Custom object, with its base and modifications
          </label>
          {objects === undefined ? (
            <p className="muted">Reading the objects…</p>
          ) : mode === "base" ? (
            <label>
              Based on{" "}
              <select
                aria-label="Based on"
                value={from}
                onChange={(event) => {
                  setBase(event.target.value);
                }}
              >
                {bases.map((object) => (
                  <option key={object.rawcode} value={object.rawcode}>
                    {optionText(object)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Copy of{" "}
              <select
                aria-label="Copy of"
                value={from}
                onChange={(event) => {
                  setCopyOf(event.target.value);
                }}
              >
                {customs.map((object) => (
                  <option key={object.rawcode} value={object.rawcode}>
                    {optionText(object)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
        <label>
          Rawcode{" "}
          <input
            className="chip-input"
            aria-label="Rawcode"
            value={rawcode}
            maxLength={4}
            onChange={(event) => {
              setChosen(true);
              setRawcode(event.target.value);
            }}
          />
        </label>{" "}
        {chosen && (
          <button
            type="button"
            className="link"
            onClick={() => {
              setChosen(false);
            }}
          >
            Suggest a free one
          </button>
        )}
        <p
          className={check?.free === false ? "field-error" : "muted"}
          role={check?.free === false ? "alert" : undefined}
          data-testid="rawcode-check"
        >
          {check === undefined
            ? "Checking…"
            : check.free
              ? `${check.rawcode} is free in all seven Object kinds.`
              : check.message}
        </p>
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
            Create
          </button>
        </footer>
      </form>
    </div>
  );
}

/** The confirmation of a delete: what names the object, its placements, and what the delete does. */
export function DeleteDialog(props: {
  readonly kind: ObjectKind;
  readonly rawcode: string;
  readonly onClose: () => void;
  readonly onDeleted: (answer: DeleteAnswer) => void;
}) {
  const { kind, rawcode, onClose, onDeleted } = props;
  const [deletion, setDeletion] = useState<DeletionAnswer>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    let live = true;
    api.deletion(kind, rawcode).then(
      (answer) => {
        if (live) setDeletion(answer);
      },
      (reason: unknown) => {
        if (live) setError(messageOf(reason));
      },
    );
    return () => {
      live = false;
    };
  }, [kind, rawcode]);
  const remove = () => {
    api.delete(kind, rawcode).then(onDeleted, (reason: unknown) => {
      setError(messageOf(reason));
    });
  };
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Delete"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog delete">
        <header>
          <h3>
            Delete {KIND_NOUNS[kind]} <code>{rawcode}</code>?
          </h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        {deletion === undefined ? (
          <p className="muted">Reading what refers to it…</p>
        ) : (
          <>
            <p data-testid="deletion-message">{deletion.message}</p>
            {deletion.referrers.length > 0 && (
              <ul className="choices">
                {deletion.referrers.map((referrer) => (
                  <li key={`${referrer.kind}:${referrer.rawcode}`}>
                    <button
                      type="button"
                      className="link"
                      onClick={() => {
                        onClose();
                        go({ rawcode: referrer.rawcode, kind: referrer.kind });
                      }}
                    >
                      {referrer.name ?? "(unnamed)"}{" "}
                      <code>{referrer.rawcode}</code>
                    </button>
                    , {KIND_NOUNS[referrer.kind]}, in{" "}
                    {referrer.fields.map((field) => (
                      <code key={field}>{field} </code>
                    ))}
                  </li>
                ))}
              </ul>
            )}
            {deletion.placementFile !== undefined && (
              <p className="muted">
                Placed on the terrain: {deletion.placements}{" "}
                {deletion.placements === 1 ? "time" : "times"}, in{" "}
                {deletion.placementFile}.
              </p>
            )}
          </>
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
          <button
            type="button"
            className="danger"
            disabled={deletion?.deletable !== true}
            onClick={remove}
          >
            Delete
          </button>
        </footer>
      </div>
    </div>
  );
}
