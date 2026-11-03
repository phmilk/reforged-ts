/**
 * Models in the Studio's page (#839): a model field's small preview, a
 * thumbnail the shared renderer draws once and the server caches; the live
 * preview, animated and in team colour, which the page's one live renderer
 * draws (`./preview.ts`); and the model picker, which searches the
 * install's and the map's models next to a live preview of the one
 * highlighted.
 */
import { useEffect, useRef, useState } from "react";
import type { ListedModel } from "../src/server/api-types.js";
import { api } from "./api.js";
import { useArtLayer } from "./parts.js";
import {
  firstModel,
  liveRenderer,
  thumbnailUrl,
  type PreviewState,
} from "./preview.js";

/** The text of a preview's state, under its canvas. */
const STATE_TEXT: Readonly<Record<PreviewState | "loading", string>> = {
  loading: "Reading the model…",
  drawn: "",
  missing: "Found neither in the map folder nor in the install.",
  failed: "This model could not be read.",
};

/**
 * The live preview of a model: the page's one live renderer, moved into
 * this box, drawing the model animated and in team colour until the box
 * goes away.
 */
export function LivePreview(props: { readonly path: string }) {
  const path = firstModel(props.path);
  const layer = useArtLayer();
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<PreviewState | "loading">("loading");
  useEffect(() => {
    const container = box.current;
    if (container === null || path === "") return;
    let live = true;
    setState("loading");
    liveRenderer.show(container, path, layer).then(
      (shown) => {
        if (live) setState(shown);
      },
      () => {
        if (live) setState("failed");
      },
    );
    return () => {
      live = false;
      liveRenderer.detach(container);
    };
  }, [path, layer]);
  return (
    <figure className="live-preview" data-preview={state}>
      <div className="preview-box" ref={box} />
      <figcaption>
        <code>{path === "" ? "—" : path}</code>{" "}
        <span className="muted">{STATE_TEXT[state]}</span>
      </figcaption>
    </figure>
  );
}

/**
 * A model's small preview, as an icon field shows its icon: its thumbnail
 * once drawn, read when it scrolls into view, else a placeholder. A click
 * opens its live preview.
 */
export function ModelThumb(props: {
  readonly path: string;
  /** What a click does; the live preview when left out. */
  readonly onOpen?: () => void;
}) {
  const path = firstModel(props.path);
  const layer = useArtLayer();
  const element = useRef<HTMLButtonElement>(null);
  const [url, setUrl] = useState<string>();
  const [state, setState] = useState<"loading" | "loaded" | "missing">(
    "loading",
  );
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setUrl(undefined);
    if (path === "") {
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
      void thumbnailUrl(path, layer, () => live).then((found) => {
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
  }, [path, layer]);
  return (
    <>
      <button
        type="button"
        ref={element}
        className={`model-thumb${url === undefined ? " placeholder" : ""}`}
        data-thumbnail={state}
        title={`Preview ${path}`}
        aria-label={`Preview ${path}`}
        onClick={() => {
          if (props.onOpen !== undefined) props.onOpen();
          else setOpen(true);
        }}
      >
        {url === undefined ? "3D" : <img src={url} alt="" />}
      </button>
      {open && (
        <PreviewDialog
          path={path}
          onClose={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

/** The live preview of one model in a dialog. */
export function PreviewDialog(props: {
  readonly path: string;
  readonly onClose: () => void;
}) {
  const { path, onClose } = props;
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Model preview"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog model-preview">
        <header>
          <h3>Model preview</h3>
          <button type="button" className="link" autoFocus onClick={onClose}>
            Close
          </button>
        </header>
        <LivePreview path={path} />
      </div>
    </div>
  );
}

/** How long the picker waits after a key before it searches, in milliseconds. */
const SEARCH_DELAY = 150;

/**
 * The model picker: the install's and the map's models whose path holds
 * the text typed, each with its thumbnail, next to a live preview of the
 * one highlighted, or a path typed.
 */
export function ModelPicker(props: {
  readonly current: string;
  readonly onPick: (path: string) => void;
  readonly onClose: () => void;
}) {
  const { current, onPick, onClose } = props;
  const layer = useArtLayer();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{
    models: readonly ListedModel[];
    total: number;
  }>();
  const [highlighted, setHighlighted] = useState(firstModel(current));
  const [typed, setTyped] = useState(current);
  useEffect(() => {
    let live = true;
    const timer = setTimeout(() => {
      api.models(query, layer).then(
        (answer) => {
          if (live) setFound(answer);
        },
        () => {
          if (live) setFound({ models: [], total: 0 });
        },
      );
    }, SEARCH_DELAY);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [query, layer]);
  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a model"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="dialog model-picker">
        <header>
          <h3>Choose a model</h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="picker-body">
          <div className="picker-list">
            <input
              autoFocus
              aria-label="Search the models"
              placeholder="Search by path"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
            {found === undefined ? (
              <p className="muted">Reading the models…</p>
            ) : (
              <>
                <p className="muted">
                  {found.total > found.models.length
                    ? `${String(found.models.length)} of ${String(found.total)} models: type to narrow them.`
                    : `${String(found.total)} models.`}
                </p>
                <ul className="model-list">
                  {found.models.map((model) => (
                    <li key={model.path}>
                      <ModelThumb
                        path={model.path}
                        onOpen={() => {
                          setHighlighted(model.path);
                        }}
                      />
                      <button
                        type="button"
                        className="model-path"
                        aria-pressed={model.path === highlighted}
                        onClick={() => {
                          setHighlighted(model.path);
                          setTyped(model.path);
                        }}
                        onDoubleClick={() => {
                          onPick(model.path);
                        }}
                      >
                        <code>{model.path}</code>
                        {model.from === "map" && (
                          <span className="chip custom">Imported</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="picker-preview">
            {highlighted === "" ? (
              <p className="muted">Choose a model to preview it.</p>
            ) : (
              <LivePreview path={highlighted} />
            )}
          </div>
        </div>
        <form
          className="icon-path"
          onSubmit={(event) => {
            event.preventDefault();
            if (typed.trim() !== "") onPick(typed.trim());
          }}
        >
          <input
            aria-label="Model path"
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
            }}
          />
          <button type="submit">Use this model</button>
        </form>
      </div>
    </div>
  );
}
