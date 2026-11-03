/**
 * The page's model previews (#839), as #481 settled them: `mdx-m3-viewer-th`
 * with its parser patched for MDX 1800 (`./mdx-1800.ts`), bundled into the
 * page, reading every file it asks for (the model, its textures, the team
 * colours, the event objects' tables) from the Studio's `GET /api/files`
 * in the session's art layer, the map folder's imports first.
 *
 * - **One live renderer** draws the open preview, animated (its `Stand`
 *   sequence, else its first) and in team colour (Player 1, red), in the one
 *   canvas the preview showing it holds.
 * - **One shared renderer** draws every thumbnail, one at a time and only
 *   when asked (a row in view), the latest asked first, into a PNG the
 *   server keeps on disk; the next time it is read from there. Chrome keeps at most 16 live WebGL
 *   contexts per page, so no field has a canvas of its own.
 *
 * A texture found nowhere (2 to 5 % of Blizzard's own references dangle)
 * never stops a preview: the viewer draws the model with its empty, white
 * texture in its place. Limits taken as they are: WebGL 1, the viewer's
 * Lambert HD shader rather than the game's PBR, and PopcornFX (`CORN`)
 * emitters not drawn.
 */
import type MdxModel from "mdx-m3-viewer-th/dist/cjs/viewer/handlers/mdx/model.js";
import type MdxModelInstance from "mdx-m3-viewer-th/dist/cjs/viewer/handlers/mdx/modelinstance.js";
import blpHandlerModule from "mdx-m3-viewer-th/dist/cjs/viewer/handlers/blp/handler.js";
import ddsHandlerModule from "mdx-m3-viewer-th/dist/cjs/viewer/handlers/dds/handler.js";
import mdxHandlerModule from "mdx-m3-viewer-th/dist/cjs/viewer/handlers/mdx/handler.js";
import tgaHandlerModule from "mdx-m3-viewer-th/dist/cjs/viewer/handlers/tga/handler.js";
import type Scene from "mdx-m3-viewer-th/dist/cjs/viewer/scene.js";
import ModelViewerModule from "mdx-m3-viewer-th/dist/cjs/viewer/viewer.js";
import type { ArtLayerName } from "../src/server/api-types.js";
import { api } from "./api.js";
import { defaultOf, patchMdxParser } from "./mdx-1800.js";

const blpHandler = defaultOf(blpHandlerModule);
const ddsHandler = defaultOf(ddsHandlerModule);
const mdxHandler = defaultOf(mdxHandlerModule);
const tgaHandler = defaultOf(tgaHandlerModule);
const ModelViewer = defaultOf(ModelViewerModule);
type ModelViewer = InstanceType<typeof ModelViewer>;

patchMdxParser();

/** The side of a thumbnail, in pixels. */
export const THUMBNAIL_SIZE = 128;

/** How many models the shared renderer draws before it starts again, its textures freed. */
const THUMBNAILS_PER_RENDERER = 24;

/** The team colour of the previews: Player 1, red. */
const TEAM_COLOR = 0;

/** The background of the previews, a dark grey, in 0 to 1. */
const BACKGROUND = [0.12, 0.13, 0.15] as const;

/** The vertical field of view of the previews' camera, in radians. */
const FIELD_OF_VIEW = Math.PI / 4;

/** The longest wait for a model's files, in milliseconds, after which it is drawn as far as it got. */
const LOAD_TIMEOUT = 15_000;

/** What showing a model gave. */
export type PreviewState = "drawn" | "missing" | "failed";

/** The first model of a field's value, which may list several (`Footman1.mdl,Footman2.mdl`). */
export function firstModel(value: string): string {
  return value.split(",")[0]?.trim() ?? "";
}

/** A viewer that reads its files from the Studio in an art layer. */
class StudioViewer {
  readonly viewer: ModelViewer;
  readonly scene: Scene;
  /** The art layer its files are read in, which the path solver reads. */
  layer: ArtLayerName;
  /** The viewer's path solver: a path to its URL in the Studio, in the art layer. */
  private readonly solver = (src: unknown): unknown =>
    typeof src === "string" ? api.fileUrl(src, this.layer) : src;

  /**
   * @param canvas - The canvas it draws in.
   * @param layer - The art layer it reads in.
   * @param preserve - Whether the drawing stays once drawn, for a PNG of it.
   */
  constructor(
    canvas: HTMLCanvasElement,
    layer: ArtLayerName,
    preserve: boolean,
  ) {
    this.layer = layer;
    this.viewer = new ModelViewer(canvas, {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: preserve,
    });
    // A file found nowhere is a 404 the viewer reports and draws past.
    this.viewer.on("error", () => undefined);
    this.viewer.addHandler(mdxHandler, this.solver, true);
    this.viewer.addHandler(blpHandler);
    this.viewer.addHandler(ddsHandler);
    this.viewer.addHandler(tgaHandler);
    this.scene = this.viewer.addScene();
    [this.scene.color[0], this.scene.color[1], this.scene.color[2]] =
      BACKGROUND;
  }

  /**
   * Shows one model, in place of the one shown, framed and in team colour,
   * once its files are read.
   */
  async show(path: string): Promise<PreviewState> {
    this.scene.clear();
    let model: MdxModel | undefined;
    try {
      model = (await this.viewer.load(path, this.solver)) as
        MdxModel | undefined;
    } catch {
      return "failed";
    }
    if (model === undefined) return "missing";
    if (!("sequences" in model)) return "failed";
    const instance = model.addInstance();
    instance.setTeamColor(TEAM_COLOR);
    const stand = model.sequences.findIndex((sequence) =>
      /^stand\b/i.test(sequence.name),
    );
    if (model.sequences.length > 0) {
      instance.setSequence(stand === -1 ? 0 : stand);
      instance.setSequenceLoopMode(2);
    }
    this.scene.addInstance(instance);
    frame(this.scene, model, instance);
    await Promise.race([
      this.viewer.whenAllLoaded(),
      new Promise((resolve) => setTimeout(resolve, LOAD_TIMEOUT)),
    ]);
    return "drawn";
  }

  /** Draws one frame, `dt` milliseconds after the last. */
  draw(dt: number): void {
    const { canvas } = this.viewer;
    const viewport = this.scene.viewport;
    if (viewport[2] !== canvas.width || viewport[3] !== canvas.height) {
      viewport[2] = canvas.width;
      viewport[3] = canvas.height;
    }
    this.viewer.updateAndRender(dt);
  }

  /** Frees its WebGL context. */
  dispose(): void {
    this.scene.clear();
    this.viewer.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

/**
 * Points a scene's camera at a model: in front of it (a unit faces +X),
 * above, far enough for its bounds to fill the view.
 */
function frame(
  scene: Scene,
  model: MdxModel,
  instance: MdxModelInstance,
): void {
  const bounds = instance.getBounds();
  const fallback = model.bounds;
  const r = bounds.r > 0 ? bounds.r : fallback.r > 0 ? fallback.r : 64;
  const centre = new Float32Array([bounds.x, bounds.y, bounds.z]);
  // The bounds' radius is half their largest side, a little more than the
  // view's height must hold of a unit, which stands in them.
  const distance = (r * 1.15) / Math.sin(FIELD_OF_VIEW / 2);
  const from = new Float32Array([
    centre[0] + distance * 0.8,
    centre[1] - distance * 0.45,
    centre[2] + distance * 0.4,
  ]);
  const { canvas } = scene.viewer;
  scene.camera.perspective(
    FIELD_OF_VIEW,
    canvas.width / Math.max(1, canvas.height),
    Math.max(1, r * 0.02),
    distance + r * 4,
  );
  scene.camera.moveToAndFace(from, centre, new Float32Array([0, 0, 1]));
}

/** The live renderer: one canvas, moved into whichever preview is open. */
class LiveRenderer {
  private viewer: StudioViewer | undefined;
  private readonly canvas = document.createElement("canvas");
  private shown: { path: string; layer: ArtLayerName } | undefined;
  private running: number | undefined;
  private last = 0;

  constructor() {
    this.canvas.className = "preview-canvas";
    this.canvas.dataset.testid = "live-preview";
  }

  /**
   * Shows a model in a preview: the canvas moves into `container`, and
   * draws the model animated until {@link LiveRenderer.detach}.
   */
  async show(
    container: HTMLElement,
    path: string,
    layer: ArtLayerName,
  ): Promise<PreviewState> {
    if (this.canvas.parentElement !== container) container.append(this.canvas);
    const width = Math.max(1, Math.round(container.clientWidth));
    const height = Math.max(1, Math.round(container.clientHeight));
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;
    // Its drawing is kept, as a thumbnail's is, so that a test reads it.
    this.viewer ??= new StudioViewer(this.canvas, layer, true);
    this.viewer.layer = layer;
    this.shown = { path, layer };
    this.canvas.dataset.state = "loading";
    const state = await this.viewer.show(path);
    // A later show replaced this one while it read.
    if (this.shown.path !== path || this.shown.layer !== layer) return state;
    this.canvas.dataset.state = state;
    this.start();
    return state;
  }

  /** Stops drawing and takes the canvas out of the page, until the next show. */
  detach(container: HTMLElement): void {
    if (this.canvas.parentElement !== container) return;
    this.canvas.remove();
    if (this.running !== undefined) cancelAnimationFrame(this.running);
    this.running = undefined;
    this.viewer?.scene.clear();
    this.shown = undefined;
  }

  private start(): void {
    if (this.running !== undefined) return;
    this.last = performance.now();
    const tick = (now: number) => {
      this.viewer?.draw(Math.min(100, now - this.last));
      this.last = now;
      this.running = requestAnimationFrame(tick);
    };
    this.running = requestAnimationFrame(tick);
  }
}

/** The page's one live renderer. */
export const liveRenderer = new LiveRenderer();

/** A thumbnail waiting for the shared renderer. */
interface ThumbnailTask {
  readonly path: string;
  readonly layer: ArtLayerName;
  /** Whether a preview on the page still wants it. */
  readonly wanted: () => boolean;
  readonly done: (png: Blob | undefined | "skipped") => void;
}

/**
 * The shared renderer of thumbnails: one off-screen canvas, one model at a
 * time, the latest asked first, so that the rows in view now come before
 * those scrolled past; one no preview wants any more is skipped.
 */
class ThumbnailRenderer {
  private viewer: StudioViewer | undefined;
  private drawn = 0;
  private readonly tasks: ThumbnailTask[] = [];
  private busy = false;

  /**
   * Draws a model's thumbnail into a PNG: undefined when it cannot be
   * drawn, `"skipped"` when no preview wanted it any more at its turn.
   */
  draw(
    path: string,
    layer: ArtLayerName,
    wanted: () => boolean,
  ): Promise<Blob | undefined | "skipped"> {
    return new Promise((done) => {
      this.tasks.push({ path, layer, wanted, done });
      void this.work();
    });
  }

  private async work(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    for (
      let task = this.tasks.pop();
      task !== undefined;
      task = this.tasks.pop()
    ) {
      if (!task.wanted()) {
        task.done("skipped");
        continue;
      }
      try {
        task.done(await this.drawNow(task.path, task.layer));
      } catch {
        task.done(undefined);
      }
    }
    this.busy = false;
  }

  private async drawNow(
    path: string,
    layer: ArtLayerName,
  ): Promise<Blob | undefined> {
    if (this.viewer === undefined || this.drawn >= THUMBNAILS_PER_RENDERER) {
      this.viewer?.dispose();
      const canvas = document.createElement("canvas");
      canvas.width = THUMBNAIL_SIZE;
      canvas.height = THUMBNAIL_SIZE;
      this.viewer = new StudioViewer(canvas, layer, true);
      this.drawn = 0;
    }
    const viewer = this.viewer;
    viewer.layer = layer;
    this.drawn++;
    const state = await viewer.show(path);
    if (state !== "drawn") return undefined;
    // The first frames build the bones' texture; the third is the one kept.
    for (let i = 0; i < 3; i++) viewer.draw(16);
    const blob = await new Promise<Blob | null>((resolve) => {
      viewer.viewer.canvas.toBlob(resolve, "image/png");
    });
    viewer.scene.clear();
    return blob ?? undefined;
  }
}

/** The page's one shared renderer of thumbnails. */
const thumbnailRenderer = new ThumbnailRenderer();

/** A thumbnail asked: its URL to come, and the previews that want it. */
interface AskedThumbnail {
  readonly url: Promise<string | undefined>;
  readonly wanted: Set<() => boolean>;
}

const thumbnails = new Map<string, AskedThumbnail>();

/**
 * The URL of a model's thumbnail: the PNG the server's cache holds, else
 * drawn by the shared renderer and given to the cache; undefined when the
 * model is found nowhere or cannot be drawn. Each path is asked once per
 * art layer, unless no preview wanted it any more when its turn came.
 *
 * @param path - The model's path, as a field holds it.
 * @param layer - The art layer.
 * @param wanted - Whether the preview asking still wants it: false once it
 *   left the page.
 */
export function thumbnailUrl(
  path: string,
  layer: ArtLayerName,
  wanted: () => boolean,
): Promise<string | undefined> {
  const key = `${layer}:${path.toLowerCase()}`;
  const asked = thumbnails.get(key);
  if (asked !== undefined) {
    asked.wanted.add(wanted);
    return asked.url;
  }
  const wanters = new Set([wanted]);
  const forget = () => {
    if (thumbnails.get(key)?.wanted === wanters) thumbnails.delete(key);
  };
  const url = (async () => {
    const cached = await api.thumbnail(path, layer);
    if (cached === "missing") return undefined;
    if (cached !== undefined) return URL.createObjectURL(cached);
    const drawn = await thumbnailRenderer.draw(path, layer, () =>
      [...wanters].some((wants) => wants()),
    );
    if (drawn === "skipped") {
      forget();
      return undefined;
    }
    if (drawn === undefined) return undefined;
    // The cache is a convenience: a refused write still shows the thumbnail.
    await api.keepThumbnail(path, layer, drawn).catch(() => undefined);
    return URL.createObjectURL(drawn);
  })().catch(() => {
    forget();
    return undefined;
  });
  thumbnails.set(key, { url, wanted: wanters });
  return url;
}

/** Forgets every thumbnail asked, after the map folder changed on disk: an import may have changed. */
export function forgetThumbnails(): void {
  thumbnails.clear();
}
