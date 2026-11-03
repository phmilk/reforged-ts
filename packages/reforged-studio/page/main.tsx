/**
 * The Studio's page: its Objects area (#832), in the layout of the
 * prototype of #476: one tab per Object kind, the tree (`./tree.tsx`), one
 * object's field table (`./object.tsx`), the global search, Ctrl+K
 * (`./search.tsx`), and the map's Game data set named at the top, with a
 * toggle that shows the objects outside it. Editing (#834): the counter of
 * unsaved changes, undo and redo (Ctrl+Z, Ctrl+Shift+Z or Ctrl+Y), the
 * explicit save (Ctrl+S) and its toast with "Reload in the World Editor",
 * the setting that makes the reload automatic, and the diff (`./edit.tsx`).
 * Adoption (#838): "Adopt into code" and its toast.
 * Creating and deleting objects (#835): "New object", its dialog and the
 * delete's confirmation (`./create.tsx`).
 * Bulk editing (#836): the Table mode (`./table.tsx`), and the bulk edit of
 * the objects Ctrl+clicked in the tree (`./bulk.tsx`).
 * It reads its route from the path, `/objects/<rawcode>[?kind=]`, and talks
 * to the server only through `./api.ts`.
 */
import { StrictMode, useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  AdoptAnswer,
  ObjectDetail,
  ObjectsAnswer,
  RawcodeAnswer,
  SessionAnswer,
  SessionCounts,
} from "../src/server/api-types.js";
import { api, listen } from "./api.js";
import { BulkDialog, type BulkStart } from "./bulk.js";
import { CreateDialog, DeleteDialog, type CreateStart } from "./create.js";
import { DiffDialog } from "./edit.js";
import { forgetIcons } from "./icons.js";
import { NoSelection, ObjectPage } from "./object.js";
import { go, KINDS, useRoute } from "./parts.js";
import { Search } from "./search.js";
import { TableMode } from "./table.js";
import { markKey, Tree, type Selection } from "./tree.js";
import "./style.css";

/** The key of a selection, its kind and Rawcode. */
const keyOf = (selection: Selection): string =>
  `${selection.kind}:${selection.rawcode}`;

/** Where the page keeps its setting of the automatic reload, in this browser only. */
const AUTO_RELOAD_KEY = "reforged-studio:reload-world-editor";

/** The automatic reload's setting as this browser kept it; off when it cannot be read. */
function readAutoReload(): boolean {
  try {
    return localStorage.getItem(AUTO_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

/** Keeps the automatic reload's setting in this browser, when it can. */
function keepAutoReload(on: boolean): void {
  try {
    localStorage.setItem(AUTO_RELOAD_KEY, on ? "1" : "0");
  } catch {
    // A webview or a private window without storage: the setting lasts the page.
  }
}

/** Whether a key press goes to a field the author types in, which keeps its own undo. */
function typing(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

/** The counts of an answer that carries them beside other fields. */
const countsOf = (answer: SessionCounts): SessionCounts => ({
  unsavedEdits: answer.unsavedEdits,
  undo: answer.undo,
  redo: answer.redo,
});

/** The toast after a save, an undo or a redo. */
interface Toast {
  readonly text: string;
  /** Whether it offers "Reload in the World Editor". */
  readonly reload?: boolean;
  /** Whether it reports a refusal. */
  readonly refused?: boolean;
}

/** The toast's text after a save. */
function savedText(answer: {
  readonly written: readonly string[];
  readonly reload: string;
  readonly reloadError?: string;
}): string {
  if (answer.written.length === 0) {
    return "Nothing to save: the map folder already holds every edit.";
  }
  const files = `Saved ${String(answer.written.length)} file${answer.written.length === 1 ? "" : "s"}: ${answer.written.join(", ")}.`;
  switch (answer.reload) {
    case "sent":
      return `${files} The World Editor reloads the map.`;
    case "no-executable":
      return `${files} The World Editor holds the map folder: start the Studio with its executable to reload the map there.`;
    case "offered":
      return answer.reloadError === undefined
        ? `${files} The World Editor holds the map folder without unsaved edits.`
        : `${files} The reload failed: ${answer.reloadError}`;
    default:
      return files;
  }
}

function App() {
  const route = useRoute();
  const [session, setSession] = useState<SessionAnswer>();
  const [kind, setKind] = useState<string>(route.kind ?? "unit");
  const [all, setAll] = useState(false);
  const [listing, setListing] = useState<ObjectsAnswer>();
  const [detail, setDetail] = useState<RawcodeAnswer>();
  const [pinned, setPinned] = useState<readonly Selection[]>([]);
  const [compared, setCompared] = useState<readonly ObjectDetail[]>([]);
  const [searching, setSearching] = useState(false);
  const [banner, setBanner] = useState<string>();
  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);
  const [counts, setCounts] = useState<SessionCounts>();
  const [toast, setToast] = useState<Toast>();
  const [diffing, setDiffing] = useState(false);
  const [autoReload, setAutoReload] = useState(readAutoReload);
  const [creating, setCreating] = useState<CreateStart>();
  const [deleting, setDeleting] = useState<Selection>();
  const [tableMode, setTableMode] = useState(false);
  const [marked, setMarked] = useState<ReadonlySet<string>>(new Set());
  const [bulking, setBulking] = useState<BulkStart>();

  const failed = useCallback((reason: unknown) => {
    setError(reason instanceof Error ? reason.message : String(reason));
  }, []);

  /** Takes the counts of a change the server made, and reads the views again. */
  const changed = useCallback((next: SessionCounts) => {
    setCounts(countsOf(next));
    setVersion((count) => count + 1);
  }, []);

  const save = useCallback(() => {
    api.save(autoReload).then((result) => {
      changed(result.answer);
      if (result.saved) {
        forgetIcons();
        setToast({
          text: savedText(result.answer),
          reload: result.answer.reload === "offered",
        });
        return;
      }
      const { answer } = result;
      const kept = (answer.notReplayed ?? [])
        .map((edit) => `${edit.edit.rawcode}: ${edit.message}`)
        .join(" ");
      setToast({
        text: `Not saved: ${answer.error.message}${kept === "" ? "" : ` Not replayed: ${kept}`}`,
        refused: true,
      });
    }, failed);
  }, [autoReload, changed, failed]);
  /** Shows a refusal of the API in the toast. */
  const refused = useCallback((reason: unknown) => {
    setToast({
      text: reason instanceof Error ? reason.message : String(reason),
      refused: true,
    });
  }, []);
  /** Takes an adoption's answer: reads the views again, the object now an Object definition, and says where it went. */
  const adopted = useCallback(
    (answer: AdoptAnswer) => {
      changed(answer);
      const { kind, rawcode, path } = answer.adopted;
      setToast({
        text: [
          `Adopted the ${kind} ${rawcode} into ${path}.`,
          ...(answer.formatted
            ? []
            : ["The Map project has no Prettier: format it before a commit."]),
          ...answer.warnings,
        ].join(" "),
      });
    },
    [changed],
  );
  const undo = useCallback(() => {
    api.undo().then(changed, refused);
  }, [changed, refused]);
  const redo = useCallback(() => {
    api.redo().then(changed, refused);
  }, [changed, refused]);
  const reloadWorldEditor = () => {
    api.reloadWorldEditor().then(() => {
      setToast({ text: "The World Editor reloads the map." });
    }, refused);
  };
  // The latest actions, for the one keyboard listener.
  const actions = useRef({ save, undo, redo });
  actions.current = { save, undo, redo };

  useEffect(
    () =>
      listen({
        reloaded: () => {
          forgetIcons();
          setBanner(
            "The map folder changed on disk: the Studio read it again.",
          );
          setVersion((count) => count + 1);
        },
        "changed-on-disk": () => {
          setBanner(
            "The map folder changed on disk; your unsaved edits are kept.",
          );
        },
        saved: (data) => {
          setCounts(countsOf(data));
        },
        adopted: (data) => {
          setCounts(countsOf(data));
          setVersion((count) => count + 1);
        },
      }),
    [],
  );
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        setSearching(true);
      } else if (key === "s") {
        event.preventDefault();
        actions.current.save();
      } else if (typing(event.target)) {
        // A field the author types in keeps its own undo.
      } else if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        actions.current.undo();
      } else if (key === "y" || (key === "z" && event.shiftKey)) {
        event.preventDefault();
        actions.current.redo();
      }
    };
    addEventListener("keydown", keydown);
    return () => {
      removeEventListener("keydown", keydown);
    };
  }, []);
  useEffect(() => {
    api.session().then((answer) => {
      setSession(answer);
      setCounts(countsOf(answer));
    }, failed);
  }, [version, failed]);
  useEffect(() => {
    api.objects(kind, all).then(setListing, failed);
  }, [kind, all, version, failed]);
  // A bulk edit's selection is of one kind: another tab starts a new one.
  useEffect(() => {
    setMarked(new Set());
  }, [kind]);
  useEffect(() => {
    if (route.rawcode === undefined) {
      setDetail(undefined);
      return;
    }
    if (route.kind !== undefined) setKind(route.kind);
    let live = true;
    api.rawcode(route.rawcode, route.kind).then((answer) => {
      if (!live) return;
      setDetail(answer);
      if (
        (answer.status === "known" ||
          answer.status === "not-in-game-data-set") &&
        answer.selected !== undefined
      ) {
        setKind(answer.selected.kind);
      }
    }, failed);
    return () => {
      live = false;
    };
  }, [route.rawcode, route.kind, version, failed]);

  const selected =
    detail !== undefined &&
    (detail.status === "known" || detail.status === "not-in-game-data-set")
      ? detail.selected
      : undefined;
  const selection =
    selected === undefined
      ? undefined
      : { kind: selected.kind, rawcode: selected.rawcode };

  // The compared objects: those pinned of the selected object's kind, but itself.
  const comparedKeys = pinned
    .filter(
      (pin) =>
        pin.kind === selected?.kind &&
        (selection === undefined || keyOf(pin) !== keyOf(selection)),
    )
    .map(keyOf)
    .join(" ");
  useEffect(() => {
    if (comparedKeys === "") {
      setCompared([]);
      return;
    }
    let live = true;
    Promise.all(
      comparedKeys.split(" ").map(async (key) => {
        const [pinKind = "", rawcode = ""] = key.split(":");
        const answer = await api.rawcode(rawcode, pinKind);
        return answer.status === "known" ||
          answer.status === "not-in-game-data-set"
          ? answer.selected
          : undefined;
      }),
    ).then((details) => {
      if (live) {
        setCompared(
          details.filter((found): found is ObjectDetail => found !== undefined),
        );
      }
    }, failed);
    return () => {
      live = false;
    };
  }, [comparedKeys, version, failed]);

  const isPinned =
    selection !== undefined &&
    pinned.some((pin) => keyOf(pin) === keyOf(selection));
  const togglePin = () => {
    if (selection === undefined) return;
    setPinned(
      isPinned
        ? pinned.filter((pin) => keyOf(pin) !== keyOf(selection))
        : [...pinned, selection],
    );
  };
  const unpin = (object: ObjectDetail) => {
    setPinned(
      pinned.filter(
        (pin) =>
          keyOf(pin) !== keyOf({ kind: object.kind, rawcode: object.rawcode }),
      ),
    );
  };

  /** Marks or unmarks an object of the tree for a bulk edit. */
  const mark = (object: Selection) => {
    const next = new Set(marked);
    if (!next.delete(markKey(object))) next.add(markKey(object));
    setMarked(next);
  };
  const markedRawcodes = (listing?.objects ?? [])
    .filter((object) => marked.has(markKey(object)))
    .map((object) => object.rawcode);

  return (
    <div className="studio">
      <header className="topbar">
        <h1>Studio</h1>
        {session !== undefined && (
          <span className="session" title={session.mapFolder}>
            {session.mapFolder.split(/[\\/]/).at(-1)} · Build {session.build}
          </span>
        )}
        <span className="game-data-set">
          Game data set:{" "}
          <b>{session?.gameDataSet?.label ?? "not stated by war3map.w3i"}</b>
        </span>
        <label>
          <input
            type="checkbox"
            checked={all}
            onChange={(event) => {
              setAll(event.target.checked);
            }}
          />{" "}
          Show objects outside it
        </label>
        <button
          type="button"
          onClick={() => {
            setCreating({ kind: kind as CreateStart["kind"] });
          }}
        >
          New object
        </button>
        <button
          type="button"
          className="search-button"
          onClick={() => {
            setSearching(true);
          }}
        >
          Search <kbd>Ctrl+K</kbd>
        </button>
        <span className="editing">
          <span
            className={`unsaved-count${(counts?.unsavedEdits ?? 0) > 0 ? " dirty" : ""}`}
            data-testid="unsaved-count"
            aria-live="polite"
          >
            {counts?.unsavedEdits ?? 0} unsaved
          </span>
          <button
            type="button"
            onClick={undo}
            disabled={(counts?.undo ?? 0) === 0}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={(counts?.redo ?? 0) === 0}
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <button
            type="button"
            onClick={() => {
              setDiffing(true);
            }}
          >
            Diff
          </button>
          <button type="button" className="primary" onClick={save}>
            Save <kbd>Ctrl+S</kbd>
          </button>
          <label title="Reload the map in the World Editor after each save, when it holds the map folder without unsaved edits">
            <input
              type="checkbox"
              checked={autoReload}
              onChange={(event) => {
                setAutoReload(event.target.checked);
                keepAutoReload(event.target.checked);
              }}
            />{" "}
            Reload the World Editor after a save
          </label>
        </span>
      </header>
      {toast !== undefined && (
        <p
          className={`toast${toast.refused === true ? " refused" : ""}`}
          role="status"
        >
          {toast.text}{" "}
          {toast.reload === true && (
            <button
              type="button"
              onClick={() => {
                setToast(undefined);
                reloadWorldEditor();
              }}
            >
              Reload in the World Editor
            </button>
          )}{" "}
          <button
            type="button"
            className="link"
            onClick={() => {
              setToast(undefined);
            }}
          >
            Dismiss
          </button>
        </p>
      )}
      {banner !== undefined && (
        <p className="banner">
          {banner}{" "}
          <button
            type="button"
            onClick={() => {
              setBanner(undefined);
            }}
          >
            Dismiss
          </button>
        </p>
      )}
      {error !== undefined && <p className="warning">{error}</p>}
      <nav className="tabs" role="tablist" aria-label="Object kinds">
        {KINDS.map(([id, label]) => (
          <button
            type="button"
            role="tab"
            key={id}
            aria-selected={id === kind}
            className={id === kind ? "selected" : undefined}
            onClick={() => {
              setKind(id);
            }}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          className="table-toggle"
          aria-pressed={tableMode}
          title="One row per object, one column per field"
          onClick={() => {
            setTableMode(!tableMode);
          }}
        >
          Table mode
        </button>
      </nav>
      {tableMode && (
        <main className="table-main">
          <TableMode
            kind={kind as BulkStart["kind"]}
            all={all}
            version={version}
            onChanged={changed}
            onBulk={setBulking}
            onOpen={(row) => {
              setTableMode(false);
              go({ rawcode: row.rawcode, kind: row.kind });
            }}
          />
        </main>
      )}
      <main hidden={tableMode}>
        <aside>
          {markedRawcodes.length > 0 ? (
            <p className="bulk-bar" data-testid="bulk-bar">
              {markedRawcodes.length} selected{" "}
              <button
                type="button"
                onClick={() => {
                  setBulking({
                    kind: kind as BulkStart["kind"],
                    rawcodes: markedRawcodes,
                  });
                }}
              >
                Edit a field…
              </button>{" "}
              <button
                type="button"
                className="link"
                onClick={() => {
                  setMarked(new Set());
                }}
              >
                Clear
              </button>
            </p>
          ) : (
            <p className="bulk-bar muted">
              Ctrl+click objects to edit a field on all of them.
            </p>
          )}
          <Tree
            objects={listing?.objects ?? []}
            selected={selection}
            marked={marked}
            onMark={mark}
          />
        </aside>
        <section className="pane">
          {detail === undefined ? (
            <p className="notice muted">Choose an object.</p>
          ) : selected !== undefined &&
            (detail.status === "known" ||
              detail.status === "not-in-game-data-set") ? (
            <ObjectPage
              answer={detail}
              selected={selected}
              compared={compared}
              pinned={isPinned}
              onPin={togglePin}
              onUnpin={unpin}
              onChanged={changed}
              onAdopted={adopted}
              onCreate={setCreating}
              onDelete={() => {
                setDeleting(selection);
              }}
            />
          ) : (
            <NoSelection
              answer={detail}
              onCreate={(rawcode) => {
                setCreating({ kind: kind as CreateStart["kind"], rawcode });
              }}
            />
          )}
        </section>
      </main>
      {bulking !== undefined && (
        <BulkDialog
          start={bulking}
          onClose={() => {
            setBulking(undefined);
          }}
          onDone={(answer) => {
            setBulking(undefined);
            changed(answer);
            setToast({
              text:
                answer.edited === 0
                  ? "Nothing to change: no object modifies that field."
                  : `Edited ${String(answer.edited)} object${answer.edited === 1 ? "" : "s"} as one step: Undo takes it back.`,
            });
          }}
        />
      )}
      {creating !== undefined && (
        <CreateDialog
          start={creating}
          onClose={() => {
            setCreating(undefined);
          }}
          onCreated={(answer) => {
            setCreating(undefined);
            changed(answer);
            setToast({
              text: `Created ${answer.rawcode}: save to write it to the map folder.`,
            });
            go({ rawcode: answer.rawcode, kind: answer.kind });
          }}
        />
      )}
      {deleting !== undefined && (
        <DeleteDialog
          kind={deleting.kind as CreateStart["kind"]}
          rawcode={deleting.rawcode}
          onClose={() => {
            setDeleting(undefined);
          }}
          onDeleted={(answer) => {
            setDeleting(undefined);
            changed(answer);
            setToast({
              text: `Deleted ${deleting.rawcode}: save to remove it from the map folder.`,
            });
            go({ rawcode: undefined, kind: undefined });
          }}
        />
      )}
      {diffing && (
        <DiffDialog
          onClose={() => {
            setDiffing(false);
          }}
        />
      )}
      {searching && (
        <Search
          all={all}
          onClose={() => {
            setSearching(false);
          }}
        />
      )}
    </div>
  );
}

const root = document.getElementById("root");
if (root !== null) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
