import { TransformNode } from "@babylonjs/core/Meshes/transformNode"
import { Scene } from "@babylonjs/core/scene"
import { Vec2 } from "planck"
import { EntityType } from "./enums"

export interface IV2{
  x:number
  y:number
}

export interface IV3{
  x:number
  y:number
  z:number
}

export interface IGame{
  addScore(points: any)
  gameOver()
  reset():void
  scene:Scene
  world:planck.World
  rootNode:TransformNode
  spawnBullet():IProjectile
}

export interface IKillable extends IEntity{
  alive:boolean
  hurt(energy:number, other:IEntity, type:string)
}


export function IsKillable(ent:IEntity):ent is IKillable{
  return (ent as IKillable).hurt !== undefined
}

export interface IEntity{
  reset(): boolean
  collision(other:IEntity)
  get type(): EntityType
  prePhysics(dT:number):boolean
  preDraw(dt:number):void
  getPosition(): IV2 
}

export interface IShooter extends IEntity{
  fireAnimation():void
  get fireVect():IV2
  get rotation():number
  get groupIndex():number
}


export interface IWeapon{
  update(dT:number):void
  fire(shooter:IShooter):void
}

export interface IProjectile extends IEntity{
  init(position:IV2, velocity:IV2, shooter:IShooter, damage:number)
}


export interface IController{
  update()
  readonly joySteer:IV2
  readonly joyAim:IV2
  fire1:boolean
  update():void
}

export interface IPool{
  Release(item:any):void
}

export interface IPooledItem<T>{
  Free:()=>void
  CleanUp:()=>void
}

