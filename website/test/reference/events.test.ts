// The events namespaces of the library's reference (#263): TypeDoc, with the
// options of the site's library reference and its plugin, converts each
// `*Events` constant, whose comment carries `@namespace`, as a Namespace with
// one documented member per descriptor, the `UnitEvents` twins included.
// Runs on the library's sources; no page is written.
import {
  Application,
  type DeclarationReflection,
  type ProjectReflection,
  ReflectionKind,
} from "typedoc";
import { beforeAll, describe, expect, it } from "vitest";
import { LIBRARY_REFERENCE, referenceTypedocOptions } from "../../reference";

/** Each events namespace and its member count. */
const NAMESPACES = {
  DialogEvents: 2,
  FrameEvents: 1,
  PlayerEvents: 11,
  RegionEvents: 2,
  TimerEvents: 1,
  TrackableEvents: 2,
  UnitEvents: 61,
} as const;

let project: ProjectReflection;

beforeAll(async () => {
  const app = await Application.bootstrapWithPlugins({
    ...referenceTypedocOptions(LIBRARY_REFERENCE, { strict: false }),
    logLevel: "Error",
  });
  const converted = await app.convert();
  if (converted === undefined) throw new Error("TypeDoc converted nothing.");
  project = converted;
}, 120_000);

/**
 * The comment a member shows: its own, or its signature's for a member
 * TypeDoc converts as a function.
 */
function commentOf(member: DeclarationReflection) {
  return member.comment ?? member.signatures?.[0]?.comment;
}

function namespace(name: string): DeclarationReflection {
  const reflection = project.getChildByName(name);
  if (reflection === undefined) throw new Error(`No ${name} in the project.`);
  return reflection as DeclarationReflection;
}

describe("an events namespace", () => {
  it.each(Object.entries(NAMESPACES))(
    "%s is a Namespace of %i members",
    (name, count) => {
      const events = namespace(name);

      expect(ReflectionKind[events.kind]).toBe("Namespace");
      expect(events.children).toHaveLength(count);
    },
  );

  it.each(Object.keys(NAMESPACES))(
    "%s documents every member, with its @native tags",
    (name) => {
      const undocumented = (namespace(name).children ?? [])
        .filter((member) => {
          const comment = commentOf(member);
          return (
            comment === undefined ||
            comment.summary.length === 0 ||
            comment.getTag("@native") === undefined
          );
        })
        .map((member) => member.name);

      expect(undocumented).toEqual([]);
    },
  );

  it("gives a UnitEvents twin its own comment and the Native it registers through", () => {
    const twin = namespace("UnitEvents").getChildByName("attackedOf");
    const comment =
      twin === undefined ? undefined : commentOf(twin as DeclarationReflection);

    expect(comment?.summary.map((part) => part.text).join("")).toContain(
      "The event of `attacked` on one Unit",
    );
    expect(
      comment
        ?.getTags("@native")
        .map((tag) => tag.content.map((part) => part.text).join("")),
    ).toEqual(["TriggerRegisterUnitEvent"]);
  });
});
