import { IKillable, IEntity, IGame, IV2 } from "../interfaces";
import { Entity } from "./entity";

export abstract class Killable extends Entity implements IKillable{
  
  alive = true
  public constructor(game:IGame, location:IV2, orientation:number, protected health:number){
    super(game, location, orientation)
  }

  hurt(energy: number, other: IEntity, type: string) {
    this.health -= energy
    if (this.health <= 0 && this.alive){
      this.killed(other)
      this.alive = false
    }
  }
  abstract killed(killer:IEntity):void

}