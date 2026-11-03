/**
 * A synthetic model in the MDX 1800 layout of 3.0's models (#481): a cube
 * of one geoset on one bone, one sequence, and one material whose one layer
 * lists its textures with their slots, as every 3.0 model's does. Its
 * texture can be one found nowhere, as 2 to 5 % of Blizzard's references
 * are. Every byte is the tests' own.
 */

/** What the cube is drawn with. */
export interface CubeOptions {
  /** The texture's path; one found nowhere draws as the viewer's placeholder. */
  readonly texture?: string;
  /** Whether its layer is HD, with six textures in their six slots; SD, with one, by default. */
  readonly hd?: boolean;
  /** Half the side of the cube. */
  readonly size?: number;
}

/** A little-endian writer of the MDX chunks. */
class Writer {
  private readonly bytes: number[] = [];

  get length(): number {
    return this.bytes.length;
  }

  tag(tag: string): this {
    for (const char of tag) this.bytes.push(char.charCodeAt(0));
    return this;
  }

  u32(...values: number[]): this {
    for (const value of values) {
      const part = new Uint8Array(4);
      new DataView(part.buffer).setUint32(0, value >>> 0, true);
      this.bytes.push(...part);
    }
    return this;
  }

  i32(...values: number[]): this {
    return this.u32(...values.map((value) => value >>> 0));
  }

  f32(...values: number[]): this {
    for (const value of values) {
      const part = new Uint8Array(4);
      new DataView(part.buffer).setFloat32(0, value, true);
      this.bytes.push(...part);
    }
    return this;
  }

  u16(...values: number[]): this {
    for (const value of values) this.bytes.push(value & 0xff, value >>> 8);
    return this;
  }

  u8(...values: number[]): this {
    this.bytes.push(...values);
    return this;
  }

  /** A string in a field of `length` bytes, padded with zeros. */
  text(value: string, length: number): this {
    const encoded = new TextEncoder().encode(value);
    for (let i = 0; i < length; i++) this.bytes.push(encoded[i] ?? 0);
    return this;
  }

  /** A chunk: its tag, its size, then what `write` writes. */
  chunk(tag: string, write: (body: Writer) => void): this {
    const body = new Writer();
    write(body);
    return this.tag(tag).u32(body.length).bytesOf(body);
  }

  /** An object prefixed with its size, the size counted in. */
  sized(write: (body: Writer) => void): this {
    const body = new Writer();
    write(body);
    return this.u32(body.length + 4).bytesOf(body);
  }

  bytesOf(other: Writer): this {
    this.bytes.push(...other.bytes);
    return this;
  }

  done(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/** An extent: its radius, then its corners. */
const extent = (body: Writer, size: number): Writer =>
  body.f32(size * Math.sqrt(3), -size, -size, -size, size, size, size);

/**
 * A cube in MDX 1800, with a `Stand` sequence: SD, one texture in slot 0,
 * or HD, six in slots 0 to 5.
 *
 * @param options - Its texture, its layer's shader and its size.
 * @returns The model's bytes.
 */
export function cubeModel(options: CubeOptions = {}): Uint8Array {
  const size = options.size ?? 50;
  const texture = options.texture ?? "Textures\\Cube.blp";
  const slots = options.hd === true ? [0, 1, 2, 3, 4, 5] : [0];
  const corners: number[] = [];
  for (const x of [-size, size]) {
    for (const y of [-size, size]) {
      for (const z of [-size, size]) corners.push(x, y, z);
    }
  }
  // Two triangles per face, by corner index (x * 4 + y * 2 + z).
  const faces = [
    [0, 1, 3, 0, 3, 2],
    [4, 6, 7, 4, 7, 5],
    [0, 4, 5, 0, 5, 1],
    [2, 3, 7, 2, 7, 6],
    [0, 2, 6, 0, 6, 4],
    [1, 5, 7, 1, 7, 3],
  ].flat();
  const writer = new Writer().tag("MDLX");
  writer.chunk("VERS", (body) => body.u32(1800));
  writer.chunk("MODL", (body) => {
    body.text("Cube", 80).text("", 260);
    extent(body, size).u32(150);
  });
  writer.chunk("SEQS", (body) => {
    body.text("Stand", 80).u32(0, 1000).f32(0).u32(0).f32(0).u32(0);
    extent(body, size);
  });
  writer.chunk("GLBS", () => undefined);
  writer.chunk("MTLS", (body) =>
    body.sized((material) => {
      material.i32(0).u32(0).tag("LAYS").u32(1);
      material.sized((layer) => {
        // Filter mode none, unshaded and two-sided, texture 0, no texture animation,
        // coordinates 0, alpha 1, emissive gain 1, fresnel colour, opacity
        // and team colour; then the shader type and the textures.
        layer.u32(0, 17).i32(0, -1).u32(0).f32(1, 1, 1, 1, 1, 0, 0);
        layer.u32(options.hd === true ? 1 : 0, slots.length);
        for (const slot of slots) layer.i32(slot).u32(slot);
      });
    }),
  );
  writer.chunk("TEXS", (body) => {
    for (const slot of slots) {
      body
        .u32(0)
        .text(slot === 0 ? texture : `Textures\\Cube${String(slot)}.blp`, 260)
        .u32(0);
    }
  });
  writer.chunk("GEOS", (body) =>
    body.sized((geoset) => {
      geoset
        .tag("VRTX")
        .u32(8)
        .f32(...corners);
      geoset
        .tag("NRMS")
        .u32(8)
        .f32(...corners.map((value) => Math.sign(value) / Math.sqrt(3)));
      geoset.tag("PTYP").u32(1, 4);
      geoset.tag("PCNT").u32(1, faces.length);
      geoset
        .tag("PVTX")
        .u32(faces.length)
        .u16(...faces);
      geoset.tag("GNDX").u32(8).u8(0, 0, 0, 0, 0, 0, 0, 0);
      geoset.tag("MTGC").u32(1, 1);
      geoset.tag("MATS").u32(1, 0);
      // Material 0, selection group and flags, LOD 0 and its name.
      geoset.u32(0, 0, 0).i32(0).text("", 80);
      extent(geoset, size).u32(1);
      extent(geoset, size);
      geoset
        .tag("UVAS")
        .u32(1)
        .tag("UVBS")
        .u32(8)
        .f32(
          ...Array.from({ length: 8 }, (_, i) => [i & 1, (i >> 1) & 1]).flat(),
        );
    }),
  );
  writer.chunk("BONE", (body) => {
    body.sized((bone) => {
      bone.text("Bone_Root", 80).i32(0, -1).u32(0x100);
    });
    body.i32(0, -1);
  });
  writer.chunk("PIVT", (body) => body.f32(0, 0, 0));
  return writer.done();
}
