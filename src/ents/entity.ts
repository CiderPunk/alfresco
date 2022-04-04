import {  Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Vec2 } from "planck";
import { EntityType } from "../enums";
import { IEntity, IGame, IV2 } from "../interfaces";

export abstract class Entity implements IEntity{

  protected readonly body: planck.Body

  constructor(protected readonly game:IGame, position:IV2, orientation:number= 0){
    this.body = this.createBody(game.world, position, orientation)
    this.body.setUserData(this);

  }
  
  getPosition(): IV2 {
    return this.body.getPosition()
  }
  
  //  abstract get position():Vector3
  abstract createBody(world:planck.World, position:IV2, orientation:number):planck.Body
  abstract collision(other: IEntity) 
  abstract reset():boolean 
  
  abstract prePhysics(dT: number): boolean 
  abstract preDraw(dt: number): void
  abstract get type(): EntityType 

}