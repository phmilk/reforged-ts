/**
 * The tree of one Object kind, as the Object Editor's: grouped by origin
 * first (Custom objects, Object definitions, modified Built-in objects,
 * then Built-in objects), and the Built-in objects by the World Editor's
 * grouping the game data model gives (race, Melee or Campaign, Units,
 * Buildings, Heroes, Special for a unit). A group renders its objects only
 * while it is open, so that the Built-in objects' groups cost nothing
 * closed. Ctrl+click (Cmd+click) marks objects for a bulk edit (#836).
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { ListedObject, ObjectOrigin } from "../src/server/api-types.js";
import { go, Icon, OutsideChip, SharedChip } from "./parts.js";

/** The tree's top groups, in order, with their headings. */
const ORIGIN_GROUPS: readonly (readonly [ObjectOrigin, string])[] = [
  ["custom", "Custom objects"],
  ["definition", "Object definitions"],
  ["modified", "Modified Built-in objects"],
  ["builtin", "Built-in objects"],
];

/** The group of a Built-in object the install does not hold. */
const OTHER_GROUP = "Other";

/** A selected object: its kind and Rawcode. */
export interface Selection {
  readonly kind: string;
  readonly rawcode: string;
}

/** The key of a marked object: its kind and its Rawcode. */
export const markKey = (object: Selection): string =>
  `${object.kind}:${object.rawcode}`;

/** Whether an object can be marked: an Object definition is edited in its file, never marked. */
export const markable = (object: ListedObject): boolean =>
  object.origin !== "definition";

/** The objects marked for a bulk edit, and how to mark or unmark one. */
const Marks = createContext<{
  readonly marked: ReadonlySet<string>;
  readonly onMark: ((object: ListedObject) => void) | undefined;
}>({ marked: new Set(), onMark: undefined });

/** One group of the tree, its subgroups nested, by its labels. */
interface Branch {
  readonly label: string;
  readonly objects: ListedObject[];
  readonly branches: Map<string, Branch>;
}

/** The Built-in objects as nested groups, in the order each first appears. */
function branchesOf(objects: readonly ListedObject[]): Branch {
  const root: Branch = { label: "", objects: [], branches: new Map() };
  for (const object of objects) {
    let branch = root;
    const group =
      object.group === undefined || object.group.length === 0
        ? [OTHER_GROUP]
        : object.group;
    for (const label of group) {
      let next = branch.branches.get(label);
      if (next === undefined) {
        next = { label, objects: [], branches: new Map() };
        branch.branches.set(label, next);
      }
      branch = next;
    }
    branch.objects.push(object);
  }
  return root;
}

/** The objects a branch holds, its subgroups' included. */
function countOf(branch: Branch): number {
  let count = branch.objects.length;
  for (const child of branch.branches.values()) count += countOf(child);
  return count;
}

/** Whether a branch holds the selected object. */
function holds(branch: Branch, selected: Selection | undefined): boolean {
  if (selected === undefined) return false;
  return (
    branch.objects.some(
      (object) =>
        object.kind === selected.kind && object.rawcode === selected.rawcode,
    ) || [...branch.branches.values()].some((child) => holds(child, selected))
  );
}

/** A group of the tree, open or closed; it opens when it comes to hold the selected object. */
function Group(props: {
  readonly label: string;
  readonly count: number;
  readonly open: boolean;
  readonly level: number;
  readonly children: () => ReactNode;
}) {
  const [open, setOpen] = useState(props.open);
  useEffect(() => {
    if (props.open) setOpen(true);
  }, [props.open]);
  return (
    <li className={`group level-${String(props.level)}`}>
      <button
        type="button"
        className="group-heading"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
      >
        <span className="caret">{open ? "▾" : "▸"}</span> {props.label}{" "}
        <span className="count">({props.count})</span>
      </button>
      {open && <ul>{props.children()}</ul>}
    </li>
  );
}

/** One object of the tree. */
function Item(props: {
  readonly object: ListedObject;
  readonly selected: boolean;
}) {
  const { object, selected } = props;
  const { marked, onMark } = useContext(Marks);
  const isMarked = marked.has(markKey(object));
  const canMark = onMark !== undefined && markable(object);
  return (
    <li>
      <button
        type="button"
        className={`item${selected ? " selected" : ""}${isMarked ? " marked" : ""}`}
        aria-current={selected ? "true" : undefined}
        aria-pressed={canMark ? isMarked : undefined}
        data-rawcode={object.rawcode}
        title={canMark ? "Ctrl+click to select it for a bulk edit" : undefined}
        onClick={(event) => {
          if (canMark && (event.ctrlKey || event.metaKey)) {
            onMark(object);
            return;
          }
          go({ rawcode: object.rawcode, kind: object.kind });
        }}
      >
        <Icon
          path={object.icon}
          layers={object.layerIcons}
          label={object.name ?? object.rawcode}
        />
        <span className="name">{object.name ?? "(unnamed)"}</span>
        {object.origin === "definition" && (
          <span aria-label="read-only">🔒</span>
        )}
        <SharedChip object={object} />
        <OutsideChip object={object} />
        <code className="rawcode">{object.rawcode}</code>
      </button>
    </li>
  );
}

/** A branch's subgroups then its objects. */
function BranchItems(props: {
  readonly branch: Branch;
  readonly selected: Selection | undefined;
  readonly level: number;
}) {
  const { branch, selected, level } = props;
  return (
    <>
      {[...branch.branches.values()].map((child) => (
        <Group
          key={child.label}
          label={child.label}
          count={countOf(child)}
          open={holds(child, selected)}
          level={level}
        >
          {() => (
            <BranchItems branch={child} selected={selected} level={level + 1} />
          )}
        </Group>
      ))}
      {branch.objects.map((object) => (
        <Item
          key={`${object.kind}:${object.rawcode}`}
          object={object}
          selected={
            selected?.kind === object.kind &&
            selected.rawcode === object.rawcode
          }
        />
      ))}
    </>
  );
}

/** The tree of one kind's objects. */
export function Tree(props: {
  readonly objects: readonly ListedObject[];
  readonly selected: Selection | undefined;
  /** The objects marked for a bulk edit, by {@link markKey}. */
  readonly marked?: ReadonlySet<string>;
  /** Marks or unmarks an object, on a Ctrl+click. */
  readonly onMark?: (object: ListedObject) => void;
}) {
  const { objects, selected, marked = new Set<string>(), onMark } = props;
  return (
    <Marks.Provider value={{ marked, onMark }}>
      <ul className="tree" aria-label="Objects">
        {ORIGIN_GROUPS.map(([origin, heading]) => {
          const inGroup = objects.filter((object) => object.origin === origin);
          if (inGroup.length === 0) return null;
          const root = branchesOf(inGroup);
          return (
            <Group
              key={origin}
              label={heading}
              count={inGroup.length}
              open
              level={0}
            >
              {() =>
                origin === "builtin" ? (
                  <BranchItems branch={root} selected={selected} level={1} />
                ) : (
                  inGroup.map((object) => (
                    <Item
                      key={`${object.kind}:${object.rawcode}`}
                      object={object}
                      selected={
                        selected?.kind === object.kind &&
                        selected.rawcode === object.rawcode
                      }
                    />
                  ))
                )
              }
            </Group>
          );
        })}
      </ul>
    </Marks.Provider>
  );
}
