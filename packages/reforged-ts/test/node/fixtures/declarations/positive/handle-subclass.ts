// A Map project wraps a Handle type the library does not wrap with its own
// class on the Handle base: no constructor, the inherited lookup and the
// creation helper; a subclass that adds a field takes the Handle and calls
// the base with it.
import { Handle } from "reforged-ts";

class Trackable extends Handle<trackable> {
  public static create(model: string, x: number, y: number): Trackable {
    return this.expect(CreateTrackable(model, x, y, 0), model);
  }
}

class LabelledTrackable extends Trackable {
  public readonly label: string;

  protected constructor(handle: trackable) {
    super(handle);
    this.label = "";
  }
}

declare const h: trackable;

const created: Trackable = Trackable.create("model.mdx", 0, 0);
const found: Trackable | undefined = Trackable.fromHandle(h);
const labelled: LabelledTrackable | undefined = LabelledTrackable.fromHandle(h);
const id: number = created.id;

export { created, found, labelled, id };
