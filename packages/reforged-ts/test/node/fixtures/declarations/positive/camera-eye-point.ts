// The camera accessors whose Natives allocate a location are creations:
// they return the Point itself.
import { Camera, CameraSetup, Point } from "reforged-ts";

const eye: Point = Camera.eyePoint;
const target: Point = Camera.targetPoint;
const dest: Point = CameraSetup.create().destPoint;

export { dest, eye, target };
