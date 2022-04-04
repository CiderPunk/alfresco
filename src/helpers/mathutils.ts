import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { IV2 } from "../interfaces";

export function lerpLimit(a:number, b:number, s:number):number{
  return a + ((b - a) * (s > 1? 1: s))
}

export function vectToAngle(v:IV2):number{
  return Math.atan2(v.y, v.x)
}

export function angToVect(a:number, len:number):IV2{
  return { x:Math.cos(a) * len, y:Math.sin(a) * len}

}