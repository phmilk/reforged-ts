// A factory whose Native cannot fail returns the Wrapper itself.
import { Timer } from "reforged-ts";

const timer: Timer = Timer.create();

export { timer };
