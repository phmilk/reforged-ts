/**
 * The small parts the Objects area is made of: the route, an object's icon
 * with its placeholder, and its chips (its origin, a Rawcode another kind
 * shares, a Built-in object outside the map's Game data set).
 */
import { useEffect, useRef, useState } from "react";
import type { ObjectKind } from "reforged-map";
import type { ListedObject } from "../src/server/api-types.js";
import { iconUrl } from "./icons.js";

/** The Object kinds, in the Object Editor's order, with their tabs' labels. */
export const KINDS: readonly (readonly [ObjectKind, string])[] = [
  ["unit", "Units"],
  ["item", "Items"],
  ["ability", "Abilities"],
  ["buff", "Buffs/Effects"],
  ["destructable", "Destructibles"],
  ["doodad", "Doodads"],
  ["upgrade", "Upgrades"],
];

/** An Object kind's name in a sentence: `a destructable`. */
export const KIND_NOUNS: Readonly<Record<ObjectKind, string>> = {
  unit: "a unit",
  item: "an item",
  ability: "an ability",
  buff: "a buff",
  destructable: "a destructable",
  doodad: "a doodad",
  upgrade: "an upgrade",
};

/** The route the path names: `/objects/<rawcode>?kind=<kind>`. */
export interface Route {
  readonly rawcode: string | undefined;
  readonly kind: string | undefined;
}

/** The route of the page's path. */
export function readRoute(): Route {
  const match = /^\/objects\/([^/]+)/.exec(location.pathname);
  const kind = new URLSearchParams(location.search).get("kind") ?? undefined;
  return {
    rawcode:
      match?.[1] === undefined ? undefined : decodeURIComponent(match[1]),
    kind,
  };
}

/** Goes to a route, as a link from the hover would. */
export function go(route: Route): void {
  const path =
    route.rawcode === undefined
      ? "/objects"
      : `/objects/${encodeURIComponent(route.rawcode)}${route.kind === undefined ? "" : `?kind=${encodeURIComponent(route.kind)}`}`;
  history.pushState(null, "", path);
  dispatchEvent(new PopStateEvent("popstate"));
}

/** The route, kept up to date with the history. */
export function useRoute(): Route {
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

/** The two letters a placeholder shows for an object or a path. */
function initials(text: string): string {
  const name = text.replace(/.*[\\/]/, "").replace(/^BTN/i, "");
  const capitals = name.replace(/[^A-Z]/g, "");
  return (capitals.length > 0 ? capitals : name).slice(0, 2);
}

/**
 * An icon, read when it scrolls into view: its PNG once decoded, else a
 * placeholder with the initials of `label`.
 */
export function Icon(props: {
  readonly path: string | undefined;
  readonly label: string;
  readonly size?: "small" | "large";
}) {
  const { path, label, size = "small" } = props;
  const element = useRef<HTMLSpanElement>(null);
  const [url, setUrl] = useState<string | undefined>();
  const [state, setState] = useState<"loading" | "loaded" | "missing">(
    path === undefined ? "missing" : "loading",
  );
  useEffect(() => {
    setUrl(undefined);
    if (path === undefined) {
      setState("missing");
      return;
    }
    setState("loading");
    const target = element.current;
    if (target === null) return;
    let live = true;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void iconUrl(path).then((found) => {
        if (!live) return;
        setUrl(found);
        setState(found === undefined ? "missing" : "loaded");
      });
    });
    observer.observe(target);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [path]);
  return (
    <span
      ref={element}
      className={`icon ${size}${url === undefined ? " placeholder" : ""}`}
      data-icon={state}
      title={path}
    >
      {url === undefined ? initials(label) : <img src={url} alt="" />}
    </span>
  );
}

/** The labels of the origins, as the chips name them. */
export const ORIGIN_LABELS: Readonly<Record<ListedObject["origin"], string>> = {
  custom: "Custom",
  definition: "Object definition",
  modified: "Modified Built-in",
  builtin: "Built-in",
};

/** An object's origin chip: an Object definition's with its lock and its file. */
export function OriginChip(props: { readonly object: ListedObject }) {
  const { object } = props;
  return (
    <span
      className={`chip ${object.origin}`}
      title={
        object.definition === undefined
          ? undefined
          : `Defined in ${object.definition.path}`
      }
    >
      {object.origin === "definition" && (
        <span aria-label="read-only">🔒 </span>
      )}
      {ORIGIN_LABELS[object.origin]}
      {object.definition !== undefined && (
        <span className="file"> · {object.definition.path}</span>
      )}
    </span>
  );
}

/** The warning chip of a Rawcode another Object kind shares, naming the other kinds when they are known. */
export function SharedChip(props: {
  readonly object: ListedObject;
  readonly others?: readonly ObjectKind[];
}) {
  const { object, others } = props;
  if (!object.shared) return null;
  return (
    <span
      className="chip warn"
      title={`Two Object kinds use ${object.rawcode}: FourCC("${object.rawcode}") gets no typed overload.`}
    >
      ⚠{" "}
      {others === undefined || others.length === 0
        ? `${object.rawcode} is shared`
        : `${object.rawcode} is also ${others.map((kind) => KIND_NOUNS[kind]).join(" and ")}`}
    </span>
  );
}

/** The chip of a Built-in object outside the map's Game data set. */
export function OutsideChip(props: { readonly object: ListedObject }) {
  if (props.object.inGameDataSet) return null;
  return (
    <span className="chip outside">not in this map&apos;s Game data set</span>
  );
}
