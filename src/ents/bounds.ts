import { World } from "planck";
import planck = require("planck");
import { CollisionGroup, EntityType } from "../enums";
import { IV2, IEntity, IGame } from "../interfaces";
import { Entity } from "./entity";

export class Bounds extends Entity{


  public constructor(game:IGame, readonly size:IV2, mask:CollisionGroup){
    super(game, {x:0, y:0})

    //cant access this.size in createBody so do this here... sigh
    const playerBoundsShape = new planck.Chain([ new planck.Vec2(-this.size.x,-this.size.y), new planck.Vec2(this.size.x, -this.size.y),new planck.Vec2(this.size), new planck.Vec2(-this.size.x, this.size.y) ], true)
    const playerFix = this.body.createFixture({shape: playerBoundsShape, restitution: 1})
    playerFix.setFilterData({ 
      groupIndex: 0, 
      categoryBits:CollisionGroup.boundary,
      maskBits: mask 
    })

  }

  createBody(world: World, position: IV2, orientation: number):planck.Body {
    const body = world.createBody({type: planck.Body.STATIC, position: planck.Vec2(0,0) })
    return body
  }

  reset(): boolean { return true  }
  collision(other: IEntity) { 
    //do nothing
   }
  prePhysics(dT: number): boolean { return true }
  preDraw(dt: number): void {
    //do nothing 
  }
  get type(): EntityType { return EntityType.boundary } 




}