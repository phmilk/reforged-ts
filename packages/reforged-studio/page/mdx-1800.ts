/**
 * The patch of `mdx-m3-viewer-th`'s MDX parser for the versions after 1000,
 * up to 1800, every 3.0 model's (#481, `docs/research/studio-model-previews.md`).
 * The parser reads versions 800 to 1000 only, so it throws on every model of
 * 3.0, the SD ones included. The patch replaces the reading of six of its
 * parser files, in place on their classes, so that the viewer the page
 * bundles reads them:
 *
 * - `material.js`: the shader name only from 900 to 1099; from 1100, an HD
 *   layer's six textures become the six layers the viewer draws as
 *   `Shader_HD_DefaultUnit`;
 * - `layer.js`: from 1100, the shader type, the textures, each with its
 *   slot and an optional `KMTF` track;
 * - `geoset.js`: from 1400, `SKIN` in 16 bits, narrowed to the 8 the viewer
 *   reads;
 * - `camera.js`: from 1800, the variant in the top byte of the size, and
 *   the 12 bytes of variants 1 and 2;
 * - `light.js`: the shadow intensity (1200), the shadow casting with its
 *   start and end (1300), the quadratic and linear falloff and the damping
 *   (1600);
 * - `animationmap.js`: the tracks of those fields.
 *
 * The layouts are those HiveWE's and WhiteoutLib's readers give, read for
 * facts only (HiveWE is AGPL: no code of it is here), and were checked by
 * parsing every model of the 3.0.1 install. Limits taken as they are: an
 * SD-on-HD or crystal layer draws as SD, and a model with more than 255
 * bones keeps its bone indices only up to 255.
 *
 * `mdx-m3-viewer-th` is MIT (Copyright (c) 2013-2021 Chananya Freiman):
 * its notice is in the package's `NOTICES.md`.
 */
import type BinaryStreamModule from "mdx-m3-viewer-th/dist/cjs/common/binarystream.js";
import animationMapModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/animationmap.js";
import {
  FloatAnimation,
  type Animation,
} from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/animations.js";
import CameraModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/camera.js";
import GenericObjectModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/genericobject.js";
import GeosetModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/geoset.js";
import LayerModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/layer.js";
import LightModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/light.js";
import MaterialModule from "mdx-m3-viewer-th/dist/cjs/parsers/mdlx/material.js";

/**
 * The default export of a CommonJS module of `mdx-m3-viewer-th`, whose
 * `exports.default` a bundler gives as the import itself and Node as the
 * import's `default`.
 */
export type DefaultOf<M> = M extends { default: infer D } ? D : M;

/**
 * A CommonJS module's default export, the same in the page's bundle and in
 * Node, where the tests read models.
 *
 * @param imported - What the default import gave.
 * @returns The module's `exports.default`.
 */
export function defaultOf<M>(imported: M): DefaultOf<M> {
  if (
    typeof imported === "object" &&
    imported !== null &&
    "default" in imported
  ) {
    return (imported as { default: DefaultOf<M> }).default;
  }
  return imported as DefaultOf<M>;
}

type BinaryStream = InstanceType<DefaultOf<typeof BinaryStreamModule>>;

const animationMap = defaultOf(animationMapModule);
const Camera = defaultOf(CameraModule);
const GenericObject = defaultOf(GenericObjectModule);
const Geoset = defaultOf(GeosetModule);
const Layer = defaultOf(LayerModule);
const Light = defaultOf(LightModule);
const Material = defaultOf(MaterialModule);
type Camera = InstanceType<typeof Camera>;
type Geoset = InstanceType<typeof Geoset>;
type Layer = InstanceType<typeof Layer>;
type Light = InstanceType<typeof Light>;
type Material = InstanceType<typeof Material>;

/** The first version whose layers list their textures, and whose materials lose their shader name. */
export const TEXTURED_LAYERS = 1100;

/** The first version whose `SKIN` chunk holds 16-bit values. */
const WIDE_SKIN = 1400;

/** The first version whose camera's size carries a variant in its top byte. */
const CAMERA_VARIANTS = 1800;

/** A layer's shader type from 1100: 0 SD, 1 HD, 2 SD on HD, 24 crystal. */
export const HD_SHADER_TYPE = 1;

/** The shader the viewer draws a material of six layers with: diffuse, normal, ORM, emissive, team colour, environment. */
export const HD_SHADER = "Shader_HD_DefaultUnit";

/** The six texture slots of an HD layer, in the order the viewer reads its six layers. */
const HD_SLOTS = 6;

/** A layer's texture from 1100: the texture's id, its slot, and its `KMTF` track when it has one. */
export interface LayerTexture {
  readonly id: number;
  readonly slot: number;
  readonly track?: Animation;
}

/** What the patch adds to a layer read from version 1100. */
interface TexturedLayer {
  /** The layer's shader type, {@link HD_SHADER_TYPE} for HD. */
  shaderType?: number;
  /** Its textures, each with its slot. */
  textures?: LayerTexture[];
}

/** The tracks of 1200 to 1800, beside those the parser maps. */
const NEW_TRACKS: Readonly<Record<string, string>> = {
  // Light
  KLSS: "ShadowStart",
  KLSE: "ShadowEnd",
  KLQF: "QuadraticFalloff",
  KLLF: "LinearFalloff",
  KLDA: "Damping",
  // Camera
  IDUF: "FieldOfView",
  ELAF: "FarClip",
  PTSF: "NearClip",
};

/** Whether {@link patchMdxParser} ran. */
let patched = false;

/**
 * Patches the parser's classes in place, once: every model the viewer
 * loads afterwards is read up to version 1800.
 */
export function patchMdxParser(): void {
  if (patched) return;
  patched = true;

  const tracks = animationMap as unknown as Record<string, unknown>;
  for (const [tag, token] of Object.entries(NEW_TRACKS)) {
    tracks[tag] ??= [token, FloatAnimation];
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method -- the parser's own reading, kept to be called on the instance with `.call(this, …)`
  const readLayer = Layer.prototype.readMdx;
  Layer.prototype.readMdx = function (
    this: Layer & TexturedLayer,
    stream: BinaryStream,
    version: number,
  ): void {
    if (version < TEXTURED_LAYERS) {
      readLayer.call(this, stream, version);
      return;
    }
    const start = stream.index;
    const size = stream.readUint32();
    // The filter mode and the flags, numbers the parser's enums name.
    Object.assign(this, {
      filterMode: stream.readUint32(),
      flags: stream.readUint32(),
    });
    this.textureId = stream.readInt32();
    this.textureAnimationId = stream.readInt32();
    this.coordId = stream.readUint32();
    this.alpha = stream.readFloat32();
    this.emissiveGain = stream.readFloat32();
    stream.readFloat32Array(this.fresnelColor);
    this.fresnelOpacity = stream.readFloat32();
    this.fresnelTeamColor = stream.readFloat32();
    this.shaderType = stream.readUint32();
    const textures: LayerTexture[] = [];
    for (let i = 0, count = stream.readUint32(); i < count; i++) {
      const id = stream.readInt32();
      const slot = stream.readUint32();
      let track: Animation | undefined;
      if (stream.remaining >= 4 && peekTag(stream) === "KMTF") {
        stream.skip(4);
        track = new (tracks.KMTF as [string, new () => Animation])[1]();
        track.readMdx(stream, "KMTF");
      }
      textures.push({ id, slot, ...(track !== undefined && { track }) });
    }
    this.textures = textures;
    const first =
      textures.find((texture) => texture.slot === 0) ?? textures.at(0);
    if (first !== undefined) this.textureId = first.id;
    this.readAnimations(stream, size - (stream.index - start));
    if (first?.track !== undefined) this.animations.push(first.track);
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method -- the parser's own reading, kept to be called on the instance with `.call(this, …)`
  const readMaterial = Material.prototype.readMdx;
  Material.prototype.readMdx = function (
    this: Material,
    stream: BinaryStream,
    version: number,
  ): void {
    if (version < TEXTURED_LAYERS) {
      readMaterial.call(this, stream, version);
      return;
    }
    stream.readUint32(); // The size.
    this.priorityPlane = stream.readInt32();
    Object.assign(this, { flags: stream.readUint32() });
    stream.skip(4); // LAYS
    for (let i = 0, count = stream.readUint32(); i < count; i++) {
      const layer = new Layer();
      layer.readMdx(stream, version);
      this.layers.push(layer);
    }
    const [only] = this.layers as (Layer & TexturedLayer)[];
    if (
      this.layers.length === 1 &&
      only.shaderType === HD_SHADER_TYPE &&
      only.textures !== undefined
    ) {
      this.shader = HD_SHADER;
      this.layers = hdLayers(only, only.textures);
    }
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method -- the parser's own reading, kept to be called on the instance with `.call(this, …)`
  const readGeoset = Geoset.prototype.readMdx;
  Geoset.prototype.readMdx = function (
    this: Geoset,
    stream: BinaryStream,
    version: number,
  ): void {
    if (version < WIDE_SKIN) {
      readGeoset.call(this, stream, version);
      return;
    }
    // The parser reads SKIN as bytes: read the geoset with the parser on a
    // copy of its bytes whose SKIN is narrowed to them.
    const start = stream.index;
    const size = new DataView(
      stream.uint8array.buffer,
      stream.uint8array.byteOffset + start,
      4,
    ).getUint32(0, true);
    const narrowed = narrowSkin(
      stream.uint8array.subarray(start, start + size),
    );
    const copy = new (
      stream.constructor as new (bytes: Uint8Array) => BinaryStream
    )(narrowed);
    readGeoset.call(this, copy, version);
    stream.skip(size);
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method -- the parser's own reading, kept to be called on the instance with `.call(this, …)`
  const readCamera = Camera.prototype.readMdx;
  Camera.prototype.readMdx = function (
    this: Camera,
    stream: BinaryStream,
    version?: number,
  ): void {
    if (version === undefined || version < CAMERA_VARIANTS) {
      readCamera.call(this, stream);
      return;
    }
    const word = stream.readUint32();
    const size = word & 0xffffff;
    const variant = word >>> 24;
    this.name = stream.read(80);
    stream.readFloat32Array(this.position);
    this.fieldOfView = stream.readFloat32();
    this.farClippingPlane = stream.readFloat32();
    this.nearClippingPlane = stream.readFloat32();
    stream.readFloat32Array(this.targetPosition);
    let read = 120;
    if (variant === 1 || variant === 2) {
      stream.skip(12);
      read += 12;
    }
    this.readAnimations(stream, size - read);
  };

  // eslint-disable-next-line @typescript-eslint/unbound-method -- the parser's own reading, kept to be called on the instance with `.call(this, …)`
  const readLight = Light.prototype.readMdx;
  Light.prototype.readMdx = function (
    this: Light,
    stream: BinaryStream,
    version?: number,
  ): void {
    if (version === undefined || version < 1200) {
      readLight.call(this, stream);
      return;
    }
    const start = stream.index;
    const size = stream.readUint32();
    GenericObject.prototype.readMdx.call(this, stream);
    Object.assign(this, { type: stream.readUint32() });
    stream.readFloat32Array(this.attenuation);
    stream.readFloat32Array(this.color);
    this.intensity = stream.readFloat32();
    stream.readFloat32Array(this.ambientColor);
    this.ambientIntensity = stream.readFloat32();
    // The shadow intensity (1200); the shadow casting, its start and end
    // (1300); the quadratic and linear falloff and the damping (1600). The
    // viewer draws none of them.
    stream.skip(4);
    if (version >= 1300) stream.skip(12);
    if (version >= 1600) stream.skip(12);
    this.readAnimations(stream, size - (stream.index - start));
  };
}

/** The tag of the next four bytes, without reading them. */
function peekTag(stream: BinaryStream): string {
  const tag = stream.readBinary(4);
  stream.skip(-4);
  return tag;
}

/**
 * The six layers the viewer draws an HD material with, one per slot, each
 * a copy of the layer read with that slot's texture; a slot without a
 * texture takes none, which the viewer draws with its empty texture.
 */
function hdLayers(layer: Layer, textures: readonly LayerTexture[]): Layer[] {
  const layers: Layer[] = [];
  for (let slot = 0; slot < HD_SLOTS; slot++) {
    const texture = textures.find((candidate) => candidate.slot === slot);
    const copy = Object.assign(new Layer(), layer);
    copy.textureId = texture?.id ?? -1;
    copy.animations = layer.animations.filter((track) => track.name !== "KMTF");
    if (texture?.track !== undefined) copy.animations.push(texture.track);
    layers.push(copy);
  }
  return layers;
}

/**
 * A geoset's bytes with its `SKIN` values narrowed from 16 bits to 8, the
 * chunk's count kept: the bytes the parser reads.
 */
function narrowSkin(bytes: Uint8Array): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const skin = skinOffset(view, bytes);
  if (skin === -1) return bytes.slice();
  const count = view.getUint32(skin + 4, true);
  const values = skin + 8;
  const narrowed = new Uint8Array(bytes.byteLength - count);
  narrowed.set(bytes.subarray(0, values));
  for (let i = 0; i < count; i++) {
    narrowed[values + i] = Math.min(view.getUint16(values + 2 * i, true), 255);
  }
  narrowed.set(bytes.subarray(values + 2 * count), values + count);
  new DataView(narrowed.buffer).setUint32(0, narrowed.byteLength, true);
  return narrowed;
}

/** Whether the four bytes at `offset` are `tag`. */
function isTag(bytes: Uint8Array, offset: number, tag: string): boolean {
  if (offset + 4 > bytes.byteLength) return false;
  for (let i = 0; i < 4; i++) {
    if (bytes[offset + i] !== tag.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * The offset of a geoset's `SKIN` tag, found by walking its chunks as the
 * parser reads them, not by searching the bytes, whose floats may spell it;
 * -1 when it has none.
 */
function skinOffset(view: DataView, bytes: Uint8Array): number {
  // VRTX, NRMS, PTYP, PCNT, PVTX, GNDX, MTGC, MATS: a tag, a count, and
  // values of 12, 12, 4, 4, 2, 1, 4 and 4 bytes.
  let at = 4;
  for (const width of [12, 12, 4, 4, 2, 1, 4, 4]) {
    at += 8 + view.getUint32(at + 4, true) * width;
  }
  // The material, the selection group and flags, the LOD and its name.
  at += 12 + 4 + 80;
  // The extent, then the sequences' extents: 28 bytes each.
  at += 28;
  at += 4 + view.getUint32(at, true) * 28;
  if (isTag(bytes, at, "TANG")) at += 8 + view.getUint32(at + 4, true) * 16;
  return isTag(bytes, at, "SKIN") ? at : -1;
}
