/**
 * The global search, Ctrl+K: by name or Rawcode across the seven Object
 * kinds, through `GET /api/search`. Arrow keys move through the results,
 * Enter opens one, Escape closes the search.
 */
import { useEffect, useRef, useState } from "react";
import type { ListedObject, SearchAnswer } from "../src/server/api-types.js";
import { api } from "./api.js";
import { go, Icon, KINDS, OriginChip, OutsideChip } from "./parts.js";

/** The milliseconds the search waits after a key before it asks. */
const DELAY = 120;

const KIND_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  KINDS.map(([kind, label]) => [kind, label]),
);

/** The search dialog, open while `onClose` has not been called. */
export function Search(props: {
  readonly all: boolean;
  readonly onClose: () => void;
}) {
  const { all, onClose } = props;
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<SearchAnswer>();
  const [highlighted, setHighlighted] = useState(0);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    if (query.trim() === "") {
      setAnswer(undefined);
      return;
    }
    let live = true;
    const timer = setTimeout(() => {
      api.search(query, all).then(
        (found) => {
          if (!live) return;
          setAnswer(found);
          setHighlighted(0);
        },
        () => undefined,
      );
    }, DELAY);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, all]);

  const objects = answer?.objects ?? [];
  const open = (object: ListedObject) => {
    onClose();
    go({ rawcode: object.rawcode, kind: object.kind });
  };

  return (
    <div
      className="overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="search" role="dialog" aria-label="Search">
        <input
          ref={input}
          type="search"
          placeholder="Find any object by name or Rawcode, in all seven kinds"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              onClose();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlighted(Math.min(highlighted + 1, objects.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlighted(Math.max(highlighted - 1, 0));
            } else if (event.key === "Enter") {
              const object = objects.at(highlighted);
              if (object !== undefined) open(object);
            }
          }}
        />
        <ul className="results" aria-label="Results">
          {objects.map((object, i) => (
            <li key={`${object.kind}:${object.rawcode}`}>
              <button
                type="button"
                className={i === highlighted ? "highlighted" : undefined}
                data-rawcode={object.rawcode}
                data-kind={object.kind}
                onClick={() => {
                  open(object);
                }}
                onMouseEnter={() => {
                  setHighlighted(i);
                }}
              >
                <Icon
                  path={object.icon}
                  label={object.name ?? object.rawcode}
                />
                <span className="name">{object.name ?? "(unnamed)"}</span>
                <code>{object.rawcode}</code>
                <span className="muted">{KIND_LABELS[object.kind]}</span>
                <OriginChip object={object} />
                <OutsideChip object={object} />
              </button>
            </li>
          ))}
          {answer !== undefined && objects.length === 0 && (
            <li className="muted">
              Nothing found.
              {answer.suggestions !== undefined &&
                answer.suggestions.length > 0 &&
                ` Did you mean ${answer.suggestions.map((suggestion) => suggestion.rawcode).join(", ")}?`}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
