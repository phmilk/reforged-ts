/** @noSelfInFile */

import { configuration } from "../reforged/configuration";
import { assertNotLocal } from "../reforged/local";
import { canonicalWrapper, Handle, type WrapperClass } from "./handle";

/**
 * The Handle, or undefined for nothing and for the frame the game hands back
 * when it finds none (a name it does not know, a missing FDF definition): a
 * frame whose handle id is 0. Reads the id once.
 */
function unlessNotFound<H extends handle>(
  handle: H | undefined,
): H | undefined {
  return handle === undefined || GetHandleId(handle) === 0 ? undefined : handle;
}

/**
 * An element of the game's user interface: a frame created from a definition
 * of an FDF (Frame Definition File), created by type, or one of the game's
 * own frames.
 * @remarks
 * Named `Frame` after the Native type `framehandle`, without its suffix.
 *
 * - A frame whose handle id is 0 is the game's "not found": it is never a
 *   Frame. The lookups return `undefined` for it and the creation members
 *   throw.
 * - Positions and sizes are in frame units: the 4:3 area in the middle of the
 *   screen spans x from 0 to 0.8 and y from 0 to 0.6, from its bottom-left
 *   corner, whatever the resolution.
 * - Each client draws its own interface, so the members marked `@async` read
 *   the local client's frame, which can differ between clients: never let
 *   them decide game state.
 * - Guides to the UI on Hive Workshop: the starting guide
 *   (https://www.hiveworkshop.com/threads/ui-frames-starting-guide.318603/),
 *   https://www.hiveworkshop.com/pastebin/913bd439799b3d917e5b522dd9ef458f20598/
 *   and the UI and FDF tag (https://www.hiveworkshop.com/tags/ui-fdf/).
 * @example Create a simple button.
 * {@includeCode ../../examples/game/frame-create-button.ts}
 * @native framehandle
 */
export class Frame extends Handle<framehandle> {
  /**
   * Creates a frame from its definition in a loaded FDF file.
   * @param name - The name of the frame definition, which is also the name
   * {@link Frame.fromName} finds the new frame by.
   * @param owner - The parent frame.
   * @param priority - The frame's priority, 0 or more.
   * @param createContext - The number that tells this frame apart from others
   * created under the same name, for {@link Frame.fromName}. It need not be
   * unique: a later frame with the same name and context takes its place in
   * the lookup.
   * @returns The new frame.
   * @throws When the game returns no frame, for example for a name no loaded
   * FDF file defines: `reforged-ts: failed to create Frame (<name>)`, at the
   * calling line. In Dev mode, also when called before the globals Init stage
   * or inside `MapPlayer.runLocal`.
   * @native BlzCreateFrame
   * @native GetHandleId
   */
  public static create(
    name: string,
    owner: Frame,
    priority: number,
    createContext: number,
  ): Frame {
    return this.expect(
      unlessNotFound(
        BlzCreateFrame(name, owner.handle, priority, createContext),
      ),
      name,
    );
  }

  /**
   * Creates a SimpleFrame from its definition in a loaded FDF file.
   * @remarks
   * SimpleFrames are a separate family of frames, with their own FDF types:
   * https://www.hiveworkshop.com/threads/ui-simpleframes.320385/
   * @param name - The name of the SimpleFrame definition, which is also the
   * name {@link Frame.fromName} finds the new frame by.
   * @param owner - The parent frame.
   * @param createContext - The number that tells this frame apart from others
   * created under the same name, for {@link Frame.fromName}. It need not be
   * unique: a later frame with the same name and context takes its place in
   * the lookup.
   * @returns The new frame.
   * @throws When the game returns no frame, for example for a name no loaded
   * FDF file defines: `reforged-ts: failed to create Frame (<name>)`, at the
   * calling line. In Dev mode, also when called before the globals Init stage
   * or inside `MapPlayer.runLocal`.
   * @native BlzCreateSimpleFrame
   * @native GetHandleId
   */
  public static createSimple(
    name: string,
    owner: Frame,
    createContext: number,
  ): Frame {
    return this.expect(
      unlessNotFound(BlzCreateSimpleFrame(name, owner.handle, createContext)),
      name,
    );
  }

  /**
   * Creates a frame of a frame type, such as `"BACKDROP"`, `"TEXT"` or
   * `"GLUEBUTTON"`, optionally from a definition to inherit.
   * @param name - The new frame's name, which {@link Frame.fromName} finds it
   * by.
   * @param owner - The parent frame.
   * @param createContext - The number that tells this frame apart from others
   * created under the same name, for {@link Frame.fromName}. It need not be
   * unique: a later frame with the same name and context takes its place in
   * the lookup.
   * @param typeName - The frame type, as an FDF file writes it.
   * @param inherits - The name of a loaded frame definition the new frame
   * copies, or `""` for none.
   * @returns The new frame.
   * @throws When the game returns no frame, for example for an unknown frame
   * type or definition: `reforged-ts: failed to create Frame (<name>)`, at the
   * calling line. In Dev mode, also when called before the globals Init stage
   * or inside `MapPlayer.runLocal`.
   * @native BlzCreateFrameByType
   * @native GetHandleId
   */
  public static createType(
    name: string,
    owner: Frame,
    createContext: number,
    typeName: string,
    inherits: string,
  ): Frame {
    return this.expect(
      unlessNotFound(
        BlzCreateFrameByType(
          typeName,
          name,
          owner.handle,
          inherits,
          createContext,
        ),
      ),
      name,
    );
  }

  /**
   * The frame's opacity, from 0 (transparent) to 255 (opaque).
   * @native BlzFrameSetAlpha
   */
  public set alpha(alpha: number) {
    BlzFrameSetAlpha(this.handle, alpha);
  }

  /**
   * Gets the frame's opacity on the local client.
   * @example Showing a panel to one player
   * {@includeCode ../../examples/game/frame-local.ts#toggle}
   * @returns The opacity, from 0 (transparent) to 255 (opaque).
   * @native BlzFrameGetAlpha
   * @async
   */
  public get alpha() {
    return BlzFrameGetAlpha(this.handle);
  }

  /**
   * Gets the frame's children on the local client.
   * @example Walking the local frame tree
   * {@includeCode ../../examples/game/frame-local.ts#tree}
   * @returns The children, in the game's order; empty when the frame has
   * none.
   * @native BlzFrameGetChildrenCount
   * @native BlzFrameGetChild
   * @async
   */
  public get children() {
    const count = this.childrenCount;
    const output: Frame[] = [];
    for (let i = 0; i < count; i++) {
      const child = this.getChild(i);
      if (child) {
        output.push(child);
      }
    }
    return output;
  }

  /**
   * Gets how many children the frame has on the local client.
   * @example Walking the local frame tree
   * {@includeCode ../../examples/game/frame-local.ts#tree}
   * @returns The number of children, 0 or more.
   * @native BlzFrameGetChildrenCount
   * @async
   */
  public get childrenCount() {
    return BlzFrameGetChildrenCount(this.handle);
  }

  /**
   * Whether the frame takes input: a disabled frame ignores clicks and
   * typing.
   * @native BlzFrameSetEnable
   */
  public set enabled(flag: boolean) {
    BlzFrameSetEnable(this.handle, flag);
  }

  /**
   * Gets whether the frame takes input on the local client.
   * @example Showing a panel to one player
   * {@includeCode ../../examples/game/frame-local.ts#toggle}
   * @returns `true` when the frame is enabled.
   * @native BlzFrameGetEnable
   * @async
   */
  public get enabled() {
    return BlzFrameGetEnable(this.handle);
  }

  /**
   * The frame's height, in frame units.
   * @remarks
   * It sets the size, keeping the width the local client reads through the
   * `width` getter.
   * @example Sizing a frame from its local size
   * {@includeCode ../../examples/game/frame-local.ts#size}
   * @native BlzFrameSetSize
   * @native BlzFrameGetWidth
   * @async
   */
  public set height(height: number) {
    BlzFrameSetSize(this.handle, this.width, height);
  }

  /**
   * Gets the frame's height on the local client.
   * @example Sizing a frame from its local size
   * {@includeCode ../../examples/game/frame-local.ts#size}
   * @returns The height, in frame units.
   * @native BlzFrameGetHeight
   * @async
   */
  public get height() {
    return BlzFrameGetHeight(this.handle);
  }

  /**
   * Gets the name the frame was created under, which
   * {@link Frame.fromName} finds it by.
   * @returns The name, or `""` when the game gives none.
   * @native BlzFrameGetName
   */
  public get name() {
    return BlzFrameGetName(this.handle) ?? "";
  }

  /**
   * The text the frame shows, for a frame that holds text, such as a text
   * frame, an edit box or a text area.
   * @native BlzFrameSetText
   */
  public set text(text: string) {
    BlzFrameSetText(this.handle, text);
  }

  /**
   * Gets the frame's text on the local client, which includes what the local
   * player typed in an edit box.
   * @example Echoing the local player's input
   * {@includeCode ../../examples/game/frame-local.ts#input}
   * @returns The text, or `""` when the frame has none.
   * @native BlzFrameGetText
   * @async
   */
  public get text() {
    return BlzFrameGetText(this.handle) ?? "";
  }

  /**
   * The largest number of characters an edit box accepts.
   * @native BlzFrameSetTextSizeLimit
   */
  public set textSizeLimit(size: number) {
    BlzFrameSetTextSizeLimit(this.handle, size);
  }

  /**
   * Gets the largest number of characters an edit box accepts.
   * @returns The limit, in characters.
   * @native BlzFrameGetTextSizeLimit
   */
  public get textSizeLimit() {
    return BlzFrameGetTextSizeLimit(this.handle);
  }

  /**
   * The value of a slider or a status bar, within the range
   * {@link Frame.setMinMaxValue} sets.
   * @native BlzFrameSetValue
   */
  public set value(value: number) {
    BlzFrameSetValue(this.handle, value);
  }

  /**
   * Gets the value of a slider or a status bar on the local client, which
   * includes where the local player dragged a slider.
   * @example Echoing the local player's input
   * {@includeCode ../../examples/game/frame-local.ts#input}
   * @returns The value, within the range {@link Frame.setMinMaxValue} sets.
   * @native BlzFrameGetValue
   * @async
   */
  public get value() {
    return BlzFrameGetValue(this.handle);
  }

  /**
   * Whether the frame and its children are shown.
   * @native BlzFrameSetVisible
   */
  public set visible(flag: boolean) {
    BlzFrameSetVisible(this.handle, flag);
  }

  /**
   * Gets whether the frame is shown on the local client.
   * @example Showing a panel to one player
   * {@includeCode ../../examples/game/frame-local.ts#toggle}
   * @returns `true` when the frame is shown.
   * @native BlzFrameIsVisible
   * @async
   */
  public get visible() {
    return BlzFrameIsVisible(this.handle);
  }

  /**
   * The frame's width, in frame units.
   * @remarks
   * It sets the size, keeping the height the local client reads through the
   * `height` getter.
   * @example Sizing a frame from its local size
   * {@includeCode ../../examples/game/frame-local.ts#size}
   * @native BlzFrameSetSize
   * @native BlzFrameGetHeight
   * @async
   */
  public set width(width: number) {
    BlzFrameSetSize(this.handle, width, this.height);
  }

  /**
   * Gets the frame's width on the local client.
   * @example Sizing a frame from its local size
   * {@includeCode ../../examples/game/frame-local.ts#size}
   * @returns The width, in frame units.
   * @native BlzFrameGetWidth
   * @async
   */
  public get width() {
    return BlzFrameGetWidth(this.handle);
  }

  /**
   * Adds a line of text at the end of a text area.
   * @param text - The line to add.
   * @returns This Frame, for chaining.
   * @native BlzFrameAddText
   */
  public addText(text: string) {
    BlzFrameAddText(this.handle, text);
    return this;
  }

  /**
   * Keeps the mouse cursor inside the frame, or lets it go again.
   * @param enable - `true` to keep the cursor inside, `false` to release it.
   * @returns This Frame, for chaining.
   * @native BlzFrameCageMouse
   */
  public cageMouse(enable: boolean) {
    BlzFrameCageMouse(this.handle, enable);
    return this;
  }

  /**
   * Removes every anchor point of the frame, before it is placed again with
   * {@link Frame.setPoint}, {@link Frame.setAbsPoint} or
   * {@link Frame.setAllPoints}.
   * @returns This Frame, for chaining.
   * @native BlzFrameClearAllPoints
   */
  public clearPoints() {
    BlzFrameClearAllPoints(this.handle);
    return this;
  }

  /**
   * Clicks the frame from code, as a mouse click on it would.
   * @returns This Frame, for chaining.
   * @native BlzFrameClick
   */
  public click() {
    BlzFrameClick(this.handle);
    return this;
  }

  /**
   * Destroys the frame.
   * @remarks
   * In Dev mode the destroyed Wrapper becomes a tombstone: any later access,
   * a second `destroy()` included, raises
   * `reforged-ts: used after destroy: <Class>#<id>`, and
   * `Reforged.debug.report()` counts it destroyed.
   * @example Tearing down a round's interface
   * {@includeCode ../../examples/game/destroy-ui.ts}
   * @returns This Frame, which must not be used again.
   * @native BlzDestroyFrame
   */
  public destroy() {
    BlzDestroyFrame(this.handle);
    this.release();
    return this;
  }

  /**
   * Gets one of the frame's children on the local client.
   * @example Walking the local frame tree
   * {@includeCode ../../examples/game/frame-local.ts#tree}
   * @param index - The child's index, from 0 to `childrenCount - 1`.
   * @returns The child, or `undefined` when the index is past the last child.
   * @native BlzFrameGetChild
   * @async
   */
  public getChild(index: number): Frame | undefined {
    return Frame.fromHandle(BlzFrameGetChild(this.handle, index));
  }

  /**
   * Anchors one point of the frame to a position of the screen.
   * @param point - The point of the frame to anchor, such as
   * `FRAMEPOINT_CENTER`.
   * @param x - The x-coordinate, in frame units, from 0 at the left edge of
   * the 4:3 area to 0.8 at its right edge.
   * @param y - The y-coordinate, in frame units, from 0 at the bottom to 0.6
   * at the top.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetAbsPoint
   */
  public setAbsPoint(point: framepointtype, x: number, y: number) {
    BlzFrameSetAbsPoint(this.handle, point, x, y);
    return this;
  }

  /**
   * Places the frame over another one, so that it takes the other's position
   * and size.
   * @param relative - The frame to cover.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetAllPoints
   */
  public setAllPoints(relative: Frame) {
    BlzFrameSetAllPoints(this.handle, relative.handle);
    return this;
  }

  /**
   * Sets the frame's opacity.
   * @param alpha - The opacity, from 0 (transparent) to 255 (opaque).
   * @returns This Frame, for chaining.
   * @native BlzFrameSetAlpha
   */
  public setAlpha(alpha: number) {
    BlzFrameSetAlpha(this.handle, alpha);
    return this;
  }

  /**
   * Enables or disables the frame: a disabled frame ignores clicks and
   * typing.
   * @param flag - `true` to enable the frame, `false` to disable it.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetEnable
   */
  public setEnabled(flag: boolean) {
    BlzFrameSetEnable(this.handle, flag);
    return this;
  }

  /**
   * Gives the keyboard focus to the frame, such as an edit box, or takes it
   * away.
   * @param flag - `true` to give the focus, `false` to take it away.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetFocus
   */
  public setFocus(flag: boolean) {
    BlzFrameSetFocus(this.handle, flag);
    return this;
  }

  /**
   * Sets the font of the frame's text.
   * @param filename - The path of the font file.
   * @param height - The height of the text, in frame units.
   * @param flags - The font flags; 0 for none.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetFont
   */
  public setFont(filename: string, height: number, flags: number) {
    BlzFrameSetFont(this.handle, filename, height, flags);
    return this;
  }

  /**
   * Sets the frame's height, keeping the width the local client reads through
   * the `width` getter.
   * @example Sizing a frame from its local size
   * {@includeCode ../../examples/game/frame-local.ts#size}
   * @param height - The height, in frame units.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetSize
   * @native BlzFrameGetWidth
   * @async
   */
  public setHeight(height: number) {
    BlzFrameSetSize(this.handle, this.width, height);
    return this;
  }

  /**
   * Sets the frame's drawing level among its siblings: a higher level draws
   * above a lower one.
   * @param level - The level, compared only with the levels of the frame's
   * siblings.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetLevel
   */
  public setLevel(level: number) {
    BlzFrameSetLevel(this.handle, level);
    return this;
  }

  /**
   * Sets the range of a slider or a status bar.
   * @param minValue - The smallest value.
   * @param maxValue - The largest value.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetMinMaxValue
   */
  public setMinMaxValue(minValue: number, maxValue: number) {
    BlzFrameSetMinMaxValue(this.handle, minValue, maxValue);
    return this;
  }

  /**
   * Aligns the frame's text vertically and horizontally.
   * @remarks
   * In w3ts 3.x this returned nothing and ended a chain; it now returns the
   * Frame, as the other setters do.
   * @param vert - The vertical alignment, such as `TEXT_JUSTIFY_MIDDLE`.
   * @param horz - The horizontal alignment, such as `TEXT_JUSTIFY_CENTER`.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetTextAlignment
   */
  public setTextAlignment(vert: textaligntype, horz: textaligntype) {
    BlzFrameSetTextAlignment(this.handle, vert, horz);
    return this;
  }

  /**
   * Sets the model a model or sprite frame shows.
   * @param modelFile - The path of the model file.
   * @param cameraIndex - The index of the model's camera to show it through;
   * 0 for the first.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetModel
   */
  public setModel(modelFile: string, cameraIndex: number) {
    BlzFrameSetModel(this.handle, modelFile, cameraIndex);
    return this;
  }

  /**
   * Gets the frame's parent on the local client.
   * @example Walking the local frame tree
   * {@includeCode ../../examples/game/frame-local.ts#tree}
   * @returns The parent, or `undefined` when the frame has none.
   * @native BlzFrameGetParent
   * @async
   */
  public getParent(): Frame | undefined {
    return Frame.fromHandle(BlzFrameGetParent(this.handle));
  }

  /**
   * Moves the frame under another parent, with which it is then shown and
   * hidden.
   * @param parent - The new parent.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetParent
   */
  public setParent(parent: Frame) {
    BlzFrameSetParent(this.handle, parent.handle);
    return this;
  }

  /**
   * Anchors one point of the frame to a point of another frame, at an offset.
   * @param point - The point of this frame to anchor, such as
   * `FRAMEPOINT_TOPLEFT`.
   * @param relative - The frame to anchor to.
   * @param relativePoint - The point of `relative` to anchor to.
   * @param x - The horizontal offset, in frame units; positive is to the
   * right.
   * @param y - The vertical offset, in frame units; positive is up.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetPoint
   */
  public setPoint(
    point: framepointtype,
    relative: Frame,
    relativePoint: framepointtype,
    x: number,
    y: number,
  ) {
    BlzFrameSetPoint(this.handle, point, relative.handle, relativePoint, x, y);
    return this;
  }

  /**
   * Scales the frame and its children.
   * @param scale - The scale factor; 1 is the frame's own size.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetScale
   */
  public setScale(scale: number) {
    BlzFrameSetScale(this.handle, scale);
    return this;
  }

  /**
   * Sets the frame's width and height.
   * @param width - The width, in frame units.
   * @param height - The height, in frame units.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetSize
   */
  public setSize(width: number, height: number) {
    BlzFrameSetSize(this.handle, width, height);
    return this;
  }

  /**
   * Plays an animation of the model a sprite frame shows.
   * @param primaryProp - The animation's primary property, as the game
   * numbers them.
   * @param flags - The animation flags; 0 for none.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetSpriteAnimate
   */
  public setSpriteAnimate(primaryProp: number, flags: number) {
    BlzFrameSetSpriteAnimate(this.handle, primaryProp, flags);
    return this;
  }

  /**
   * Sets the step of a slider: its value moves by multiples of it.
   * @param stepSize - The step, in the slider's units.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetStepSize
   */
  public setStepSize(stepSize: number) {
    BlzFrameSetStepSize(this.handle, stepSize);
    return this;
  }

  /**
   * Sets the text the frame shows, for a frame that holds text, such as a
   * text frame, an edit box or a text area.
   * @param text - The text to show, in place of the current one.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetText
   */
  public setText(text: string) {
    BlzFrameSetText(this.handle, text);
    return this;
  }

  /**
   * Sets whether a text area scrolls to its last line as text is added.
   * @param value - `true` to scroll to the last line, `false` to stay.
   * @returns This Frame, for chaining.
   * @native BlzTextAreaFrameSetAutoScroll
   */
  public setTextAreaAutoScroll(value: boolean) {
    BlzTextAreaFrameSetAutoScroll(this.handle, value);
    return this;
  }

  /**
   * Sets the color of the frame's text.
   * @param color - The color as one ARGB integer, such as
   * `BlzConvertColor(255, 255, 204, 0)` returns.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetTextColor
   */
  public setTextColor(color: number) {
    BlzFrameSetTextColor(this.handle, color);
    return this;
  }

  /**
   * Sets the largest number of characters an edit box accepts.
   * @param size - The limit, in characters.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetTextSizeLimit
   */
  public setTextSizeLimit(size: number) {
    BlzFrameSetTextSizeLimit(this.handle, size);
    return this;
  }

  /**
   * Sets the texture a frame such as a backdrop shows.
   * @param texFile - The path of the texture file.
   * @param flag - The texture flag; 0 for the default.
   * @param blend - Whether the texture's alpha channel blends it with what is
   * drawn under it.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetTexture
   */
  public setTexture(texFile: string, flag: number, blend: boolean) {
    BlzFrameSetTexture(this.handle, texFile, flag, blend);
    return this;
  }

  /**
   * Makes another frame this frame's tooltip: the game shows it while the
   * mouse is over this frame and hides it otherwise.
   * @param tooltip - The frame to show as the tooltip.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetTooltip
   */
  public setTooltip(tooltip: Frame) {
    BlzFrameSetTooltip(this.handle, tooltip.handle);
    return this;
  }

  /**
   * Sets the value of a slider or a status bar.
   * @param value - The value, within the range {@link Frame.setMinMaxValue}
   * sets.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetValue
   */
  public setValue(value: number) {
    BlzFrameSetValue(this.handle, value);
    return this;
  }

  /**
   * Tints the frame's texture or model.
   * @param color - The color as one ARGB integer, such as
   * `BlzConvertColor(255, 255, 0, 0)` returns.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetVertexColor
   */
  public setVertexColor(color: number) {
    BlzFrameSetVertexColor(this.handle, color);
    return this;
  }

  /**
   * Shows or hides the frame and its children.
   * @param flag - `true` to show the frame, `false` to hide it.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetVisible
   */
  public setVisible(flag: boolean) {
    BlzFrameSetVisible(this.handle, flag);
    return this;
  }

  /**
   * Sets the frame's width, keeping the height the local client reads through
   * the `height` getter.
   * @example Sizing a frame from its local size
   * {@includeCode ../../examples/game/frame-local.ts#size}
   * @param width - The width, in frame units.
   * @returns This Frame, for chaining.
   * @native BlzFrameSetSize
   * @native BlzFrameGetHeight
   * @async
   */
  public setWidth(width: number) {
    BlzFrameSetSize(this.handle, width, this.height);
    return this;
  }

  /**
   * Lets the game move its own frames back into place, or keeps them where the
   * Map project put them.
   * @param enable - `true` to let the game position its frames, `false` to
   * keep the positions the Map project set.
   * @native BlzEnableUIAutoPosition
   */
  public static autoPosition(enable: boolean) {
    BlzEnableUIAutoPosition(enable);
  }

  /**
   * Converts a horizontal position in frame units to pixels of the local
   * screen.
   * @remarks
   * It depends on the local resolution, so it differs between clients.
   * @example A tooltip following the local mouse
   * {@includeCode ../../examples/harness/cursor-tooltip.ts}
   * @param frameX - The x-coordinate, in frame units.
   * @returns The x-coordinate, in pixels.
   * @native BlzFrameToPixelX
   * @async
   */
  public static frameToPixelX(frameX: number) {
    return BlzFrameToPixelX(frameX);
  }

  /**
   * Converts a vertical position in frame units to pixels of the local
   * screen.
   * @remarks
   * It depends on the local resolution, so it differs between clients.
   * @example A tooltip following the local mouse
   * {@includeCode ../../examples/harness/cursor-tooltip.ts}
   * @param frameY - The y-coordinate, in frame units.
   * @returns The y-coordinate, in pixels.
   * @native BlzFrameToPixelY
   * @async
   */
  public static frameToPixelY(frameY: number) {
    return BlzFrameToPixelY(frameY);
  }

  /**
   * Gets the frame of the frame event being handled.
   * @returns The frame, or `undefined` outside a frame event.
   * @native BlzGetTriggerFrame
   */
  public static fromEvent(): Frame | undefined {
    return this.fromHandle(BlzGetTriggerFrame());
  }

  /**
   * Gets the Wrapper for a Handle, as {@link Handle.fromHandle} does, except
   * that the game's "not found" frame (handle id 0) is nothing: `undefined`,
   * never registered.
   * @typeParam C - The Wrapper class asked for: `Frame` or a subclass of it.
   * @param handle - The Handle to wrap.
   * @returns The Wrapper, the same object for the same Handle, or `undefined`
   * when `handle` is `undefined` or the "not found" frame.
   * @native GetHandleId
   */
  public static override fromHandle<C extends Handle<handle>>(
    this: WrapperClass<C>,
    handle: C["handle"] | undefined,
  ): C | undefined {
    return super.fromHandle.call(this, unlessNotFound(handle)) as C | undefined;
  }

  /**
   * Looks up the frame created under a name and a create context.
   * @remarks
   * The first lookup of a frame the library has no Wrapper for allocates a
   * Handle id, so look the frame up once, outside `MapPlayer.runLocal`, then
   * use it inside.
   * @example
   * {@includeCode ../../examples/harness/frame-from-name.ts}
   * @param name - The name the frame was created under.
   * @param createContext - The create context it was created with.
   * @returns The frame, or `undefined` when the game finds none.
   * @throws In Dev mode, when the first lookup of a frame runs inside
   * `MapPlayer.runLocal`:
   * `reforged-ts: the first Frame.fromName("<name>") inside MapPlayer.runLocal changes game state for one client, which desyncs the game: only visuals belong inside runLocal`.
   * @native BlzGetFrameByName
   * @native GetHandleId
   */
  public static fromName(
    name: string,
    createContext: number,
  ): Frame | undefined {
    const handle = unlessNotFound(BlzGetFrameByName(name, createContext));
    if (
      configuration.devMode &&
      handle !== undefined &&
      canonicalWrapper(handle) === undefined
    ) {
      assertNotLocal(`the first Frame.fromName("${name}")`, 2);
    }
    return this.fromHandle(handle);
  }

  /**
   * Gets one of the game's own frames, such as the game UI or a command
   * button.
   * @param frameType - The kind of frame, such as `ORIGIN_FRAME_GAME_UI`.
   * @param index - Which frame of that kind, from 0, for a kind that has
   * several (the command buttons, the hero buttons); 0 otherwise.
   * @returns The frame, or `undefined` when the game has none of that kind at
   * that index.
   * @native BlzGetOriginFrame
   */
  public static fromOrigin(
    frameType: originframetype,
    index: number,
  ): Frame | undefined {
    return this.fromHandle(BlzGetOriginFrame(frameType, index));
  }

  /**
   * Gets the kind of the frame event being handled, such as
   * `FRAMEEVENT_CONTROL_CLICK`.
   * @returns The event type, or `undefined` outside a frame event.
   * @native BlzGetTriggerFrameEvent
   */
  public static getEventHandle() {
    return BlzGetTriggerFrameEvent();
  }

  /**
   * Gets the text of the frame event being handled, such as what a player
   * entered in an edit box.
   * @returns The text, or `undefined` outside a frame event.
   * @native BlzGetTriggerFrameText
   */
  public static getEventText() {
    return BlzGetTriggerFrameText();
  }

  /**
   * Gets the value of the frame event being handled, such as the new value of
   * a slider.
   * @returns The value; it means nothing outside a frame event.
   * @native BlzGetTriggerFrameValue
   */
  public static getEventValue() {
    return BlzGetTriggerFrameValue();
  }

  /**
   * Hides the game's own interface, the origin frames, or shows it again.
   * @param enable - `true` to hide the game's interface, `false` to show it.
   * @native BlzHideOriginFrames
   */
  public static hideOrigin(enable: boolean) {
    BlzHideOriginFrames(enable);
  }

  /**
   * Loads a TOC file, the list of FDF files whose frame definitions
   * {@link Frame.create} and {@link Frame.createSimple} can then use.
   * @param filename - The path of the TOC file, in the map or the game's
   * files.
   * @returns `true` when the game loaded the file.
   * @native BlzLoadTOCFile
   */
  public static loadTOC(filename: string) {
    return BlzLoadTOCFile(filename);
  }

  /**
   * Converts a horizontal position in pixels of the local screen to frame
   * units.
   * @remarks
   * It depends on the local resolution, so it differs between clients.
   * @example A tooltip following the local mouse
   * {@includeCode ../../examples/harness/cursor-tooltip.ts}
   * @param pixelX - The x-coordinate, in pixels.
   * @returns The x-coordinate, in frame units.
   * @native BlzPixelToFrameX
   * @async
   */
  public static pixelToFrameX(pixelX: number) {
    return BlzPixelToFrameX(pixelX);
  }

  /**
   * Converts a vertical position in pixels of the local screen to frame
   * units.
   * @remarks
   * It depends on the local resolution, so it differs between clients.
   * @example A tooltip following the local mouse
   * {@includeCode ../../examples/harness/cursor-tooltip.ts}
   * @param pixelY - The y-coordinate, in pixels.
   * @returns The y-coordinate, in frame units.
   * @native BlzPixelToFrameY
   * @async
   */
  public static pixelToFrameY(pixelY: number) {
    return BlzPixelToFrameY(pixelY);
  }
}
