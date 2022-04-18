import { Vec2 } from "planck";
import { IV2 } from "../interfaces";

export function lerpLimit(a:number, b:number, s:number):number{
  return a + ((b - a) * (s > 1? 1: s))
}

export function vectToAngle(v:IV2):number{
  return Math.atan2(v.y, v.x)
}
export function vectToAngleInv(v:IV2):number{
  return Math.atan2(-v.y, v.x)
}

export function angToVect(a:number, len:number, res:Vec2 = new Vec2):IV2{
  return res.set(Math.cos(a) * len, Math.sin(a) * len)
}
export function angToVect2(a:number, len:number, res:Vec2 = new Vec2):IV2{
  return res.set(Math.sin(a) * len, Math.cos(a) * len)
}