// An event accessor is a lookup: the Wrapper or undefined.
import { Dialog, DialogButton } from "reforged-ts";

const clicked: Dialog | undefined = Dialog.fromEvent();
const button: DialogButton | undefined = DialogButton.fromEvent();

export { button, clicked };
