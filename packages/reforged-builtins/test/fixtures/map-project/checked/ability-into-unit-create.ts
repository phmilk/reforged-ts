// Negative: a Built-in ability's literal where Unit.create expects a unit's.
import type { MapPlayer } from "reforged-ts";
import { Unit } from "reforged-ts";
declare const owner: MapPlayer;
Unit.create(owner, FourCC("AHbz"), 0, 0);
