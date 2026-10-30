/**
 * The Studio's page: its Objects area, read-only (#832), in the layout of
 * the prototype of #476: one tab per Object kind, the tree (`./tree.tsx`),
 * one object's field table (`./object.tsx`), the global search, Ctrl+K
 * (`./search.tsx`), and the map's Game data set named at the top, with a
 * toggle that shows the objects outside it. It reads its route from the
 * path, `/objects/<rawcode>[?kind=]`, and talks to the server only through
 * `./api.ts`.
 */
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  ObjectDetail,
  ObjectsAnswer,
  RawcodeAnswer,
  SessionAnswer,
} from "../src/server/api-types.js";
import { api, listen } from "./api.js";
import { forgetIcons } from "./icons.js";
import { NoSelection, ObjectPage } from "./object.js";
import { KINDS, useRoute } from "./parts.js";
import { Search } from "./search.js";
import { Tree, type Selection } from "./tree.js";
import "./style.css";

/** The key of a selection, its kind and Rawcode. */
const keyOf = (selection: Selection): string =>
  `${selection.kind}:${selection.rawcode}`;

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

  const failed = useCallback((reason: unknown) => {
    setError(reason instanceof Error ? reason.message : String(reason));
  }, []);

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
      }),
    [],
  );
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearching(true);
      }
    };
    addEventListener("keydown", keydown);
    return () => {
      removeEventListener("keydown", keydown);
    };
  }, []);
  useEffect(() => {
    api.session().then(setSession, failed);
  }, [version, failed]);
  useEffect(() => {
    api.objects(kind, all).then(setListing, failed);
  }, [kind, all, version, failed]);
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
          className="search-button"
          onClick={() => {
            setSearching(true);
          }}
        >
          Search <kbd>Ctrl+K</kbd>
        </button>
      </header>
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
      </nav>
      <main>
        <aside>
          <Tree objects={listing?.objects ?? []} selected={selection} />
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
            />
          ) : (
            <NoSelection answer={detail} />
          )}
        </section>
      </main>
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
