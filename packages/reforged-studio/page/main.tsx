/**
 * The Studio's page, the first slice of its Objects area (#831): a tab per
 * Object kind listing its objects by origin, a search, and one object's
 * field table, at `/objects/<rawcode>[?kind=]`. It reads its route from the
 * path and talks to the server only through `./api.ts`. The tree, the
 * chips, compare and icons come with #832.
 */
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type {
  ListedObject,
  ObjectsAnswer,
  RawcodeAnswer,
  SessionAnswer,
} from "../src/server/api-types.js";
import { api, listen } from "./api.js";
import "./style.css";

const KINDS = [
  ["unit", "Units"],
  ["item", "Items"],
  ["ability", "Abilities"],
  ["buff", "Buffs/Effects"],
  ["destructable", "Destructibles"],
  ["doodad", "Doodads"],
  ["upgrade", "Upgrades"],
] as const;

const ORIGIN_LABELS: Readonly<Record<ListedObject["origin"], string>> = {
  custom: "Custom",
  definition: "Object definition",
  modified: "Modified Built-in",
  builtin: "Built-in",
};

/** The route the path names: `/objects/<rawcode>?kind=<kind>`. */
interface Route {
  readonly rawcode: string | undefined;
  readonly kind: string | undefined;
}

function readRoute(): Route {
  const match = /^\/objects\/([^/]+)/.exec(location.pathname);
  const kind = new URLSearchParams(location.search).get("kind") ?? undefined;
  return {
    rawcode:
      match?.[1] === undefined ? undefined : decodeURIComponent(match[1]),
    kind,
  };
}

function go(route: Route): void {
  const path =
    route.rawcode === undefined
      ? "/objects"
      : `/objects/${encodeURIComponent(route.rawcode)}${route.kind === undefined ? "" : `?kind=${route.kind}`}`;
  history.pushState(null, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
}

function useRoute(): Route {
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const changed = () => {
      setRoute(readRoute());
    };
    addEventListener("popstate", changed);
    return () => {
      removeEventListener("popstate", changed);
    };
  }, []);
  return route;
}

function ObjectList(props: {
  readonly objects: readonly ListedObject[];
  readonly selected: Route;
}) {
  return (
    <ul className="objects">
      {props.objects.map((object) => (
        <li key={`${object.kind}:${object.rawcode}`}>
          <button
            type="button"
            className={
              object.rawcode === props.selected.rawcode ? "selected" : undefined
            }
            onClick={() => {
              go({ rawcode: object.rawcode, kind: object.kind });
            }}
          >
            <span className="name">{object.name ?? "(unnamed)"}</span>{" "}
            <code>{object.rawcode}</code>{" "}
            <span className={`origin ${object.origin}`}>
              {ORIGIN_LABELS[object.origin]}
            </span>
            {object.shared && <span className="origin shared">shared</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ObjectView(props: { readonly answer: RawcodeAnswer }) {
  const { answer } = props;
  if (answer.status === "malformed") {
    return <p>{answer.rawcode} is not a Rawcode: four printable characters.</p>;
  }
  if (answer.status === "unknown") {
    return (
      <div>
        <p>
          <code>{answer.rawcode}</code> is neither in this map nor Built-in.
        </p>
        {answer.suggestions.length > 0 && (
          <p>
            Did you mean{" "}
            {answer.suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion.rawcode}
                onClick={() => {
                  go({ rawcode: suggestion.rawcode, kind: suggestion.kind });
                }}
              >
                {suggestion.name ?? suggestion.rawcode} (
                <code>{suggestion.rawcode}</code>)
              </button>
            ))}
            ?
          </p>
        )}
      </div>
    );
  }
  const { selected } = answer;
  if (selected === undefined) {
    return (
      <div>
        <p>
          <code>{answer.rawcode}</code> names an object of each of these Object
          kinds: choose one.
        </p>
        <ObjectList
          objects={answer.objects}
          selected={{ rawcode: undefined, kind: undefined }}
        />
      </div>
    );
  }
  return (
    <div>
      <h2>
        {selected.name ?? "(unnamed)"} <code>{selected.rawcode}</code>{" "}
        <span className={`origin ${selected.origin}`}>
          {ORIGIN_LABELS[selected.origin]}
        </span>
      </h2>
      {answer.status === "not-in-game-data-set" && (
        <p className="warning">
          Not in this map&apos;s Game data set, {answer.gameDataSet.label}.
        </p>
      )}
      {selected.readOnly !== undefined && (
        <p className="readonly">
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
        </p>
      )}
      <table className="fields">
        <thead>
          <tr>
            <th>Field</th>
            <th>Label</th>
            <th>Value</th>
            <th>Raw</th>
            <th>Base</th>
          </tr>
        </thead>
        <tbody>
          {selected.fields.map((row) => (
            <tr
              key={`${row.id}:${String(row.level ?? 0)}`}
              className={row.modified ? "modified" : undefined}
            >
              <td>
                <code>{row.id}</code>
                {row.level !== undefined && ` (${String(row.level)})`}
              </td>
              <td>{row.label}</td>
              <td>{row.modified ? String(row.value) : row.base}</td>
              <td>
                <code>{row.modified ? String(row.stored) : row.base}</code>
              </td>
              <td>{row.base}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const route = useRoute();
  const [session, setSession] = useState<SessionAnswer>();
  const [kind, setKind] = useState<string>(route.kind ?? "unit");
  const [listing, setListing] = useState<ObjectsAnswer>();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<readonly ListedObject[]>();
  const [detail, setDetail] = useState<RawcodeAnswer>();
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
    api.session().then(setSession, failed);
  }, [version, failed]);
  useEffect(() => {
    api.objects(kind).then(setListing, failed);
  }, [kind, version, failed]);
  useEffect(() => {
    if (query.trim() === "") {
      setFound(undefined);
      return;
    }
    api.search(query).then((answer) => {
      setFound(answer.objects);
    }, failed);
  }, [query, version, failed]);
  useEffect(() => {
    if (route.rawcode === undefined) {
      setDetail(undefined);
      return;
    }
    if (route.kind !== undefined) setKind(route.kind);
    api.rawcode(route.rawcode, route.kind).then(setDetail, failed);
  }, [route.rawcode, route.kind, version, failed]);

  return (
    <div className="studio">
      <header>
        <h1>Studio</h1>
        {session !== undefined && (
          <span className="session">
            {session.mapFolder}, Game data set{" "}
            {session.gameDataSet?.label ?? "unknown"}, Build {session.build}
          </span>
        )}
        <input
          type="search"
          placeholder="Search by name or Rawcode"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
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
      <nav className="tabs">
        {KINDS.map(([id, label]) => (
          <button
            type="button"
            key={id}
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
          <ObjectList
            objects={found ?? listing?.objects ?? []}
            selected={route}
          />
        </aside>
        <section>
          {detail === undefined ? (
            <p>Choose an object.</p>
          ) : (
            <ObjectView answer={detail} />
          )}
        </section>
      </main>
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
