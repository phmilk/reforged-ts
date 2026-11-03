/**
 * The page's turns with the World Editor (#837): the conflicts dialog,
 * which lists each field both the unsaved edits and a change on disk
 * changed for the author to keep theirs or take the map folder's, and the
 * dialog "Show" opens on the fields a World Editor save put back.
 */
import { useState } from "react";
import type {
  Conflict,
  ConflictChoice,
  PutBack,
  TurnAddress,
  TurnsChangedAnswer,
  TurnValue,
} from "../src/server/api-types.js";
import { api, refusalText } from "./api.js";
import { go } from "./parts.js";

/** A value of a turn as the dialogs show it. */
export function turnText(value: TurnValue): string {
  switch (value.is) {
    case "value":
      return String(value.value);
    case "unmodified":
      return "the base's value";
    case "present":
      return "the object";
    case "absent":
      return "deleted";
  }
}

/** What a turn compares, as the dialogs and banners name it: the Rawcode, then the field and its level. */
export function addressText(address: TurnAddress): string {
  if (address.field === undefined) return `${address.rawcode} (the object)`;
  return `${address.rawcode} ${address.field}${address.level === undefined ? "" : ` level ${String(address.level)}`}${address.dataPointer === undefined ? "" : ` data ${String(address.dataPointer)}`}`;
}

/** The cell that opens a turn's object. */
function ObjectLink(props: {
  readonly address: TurnAddress;
  readonly onOpen: () => void;
}) {
  const { address, onOpen } = props;
  return (
    <td>
      <button
        type="button"
        className="link"
        onClick={() => {
          onOpen();
          go({ rawcode: address.rawcode, kind: address.kind });
        }}
      >
        {addressText(address)}
      </button>
    </td>
  );
}

/**
 * The conflicts dialog: one row per field both sides changed, mine or
 * theirs chosen for each, the choices sent together. Nothing is chosen for
 * the author: a row left unchosen stays a conflict.
 */
export function ConflictsDialog(props: {
  readonly conflicts: readonly Conflict[];
  readonly onClose: () => void;
  readonly onChosen: (answer: TurnsChangedAnswer) => void;
}) {
  const { conflicts, onClose, onChosen } = props;
  const [choices, setChoices] = useState<
    Readonly<Partial<Record<string, ConflictChoice["take"]>>>
  >({});
  const [error, setError] = useState<string>();
  // The rows with a side, the only ones sent.
  const chosen = conflicts.flatMap((conflict) => {
    const take = choices[conflict.id];
    return take === undefined ? [] : [{ id: conflict.id, take }];
  });
  const chooseAll = (take: ConflictChoice["take"]) => {
    setChoices(
      Object.fromEntries(conflicts.map((conflict) => [conflict.id, take])),
    );
  };
  const apply = () => {
    api.chooseConflicts(chosen).then(onChosen, (reason: unknown) => {
      setError(refusalText(reason));
    });
  };
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Conflicts"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog turns">
        <header>
          <h3>
            {conflicts.length} field{conflicts.length === 1 ? "" : "s"} changed
            both here and on disk
          </h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="muted">
          Your unsaved values are kept until you choose. Saving waits until each
          field has a side.
        </p>
        <table className="turns">
          <thead>
            <tr>
              <th>Field</th>
              <th>Yours</th>
              <th>On disk</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.map((conflict) => (
              <tr key={conflict.id} data-conflict={conflict.id}>
                <ObjectLink address={conflict} onOpen={onClose} />
                {(["mine", "theirs"] as const).map((take) => (
                  <td key={take}>
                    <label>
                      <input
                        type="radio"
                        name={conflict.id}
                        checked={choices[conflict.id] === take}
                        onChange={() => {
                          setChoices({ ...choices, [conflict.id]: take });
                        }}
                      />{" "}
                      {turnText(
                        take === "mine" ? conflict.mine : conflict.theirs,
                      )}
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {error !== undefined && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}
        <p className="actions">
          <button
            type="button"
            onClick={() => {
              chooseAll("mine");
            }}
          >
            All mine
          </button>{" "}
          <button
            type="button"
            onClick={() => {
              chooseAll("theirs");
            }}
          >
            All on disk
          </button>{" "}
          <button
            type="button"
            className="primary"
            disabled={chosen.length === 0}
            onClick={apply}
          >
            Apply the choices
          </button>
        </p>
      </div>
    </div>
  );
}

/** The dialog "Show" opens: each field a World Editor save put back, what the Studio saved and what the map folder holds again. */
export function PutBackDialog(props: {
  readonly putBack: readonly PutBack[];
  readonly onClose: () => void;
  readonly onApply: () => void;
  readonly onKeep: () => void;
}) {
  const { putBack, onClose, onApply, onKeep } = props;
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Put back by the World Editor"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog turns">
        <header>
          <h3>Put back by a World Editor save</h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <table className="turns">
          <thead>
            <tr>
              <th>Field</th>
              <th>The Studio saved</th>
              <th>The World Editor saved</th>
            </tr>
          </thead>
          <tbody>
            {putBack.map((field) => (
              <tr key={addressText(field)}>
                <ObjectLink address={field} onOpen={onClose} />
                <td>{turnText(field.studio)}</td>
                <td>{turnText(field.worldEditor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="actions">
          <button type="button" className="primary" onClick={onApply}>
            Apply them again
          </button>{" "}
          <button type="button" onClick={onKeep}>
            Keep the World Editor&apos;s
          </button>
        </p>
      </div>
    </div>
  );
}
