import { Player } from "../ents/player";
import { IGame, IShooter, IWeapon } from "../interfaces";

export abstract class Weapon implements IWeapon{
  //time to fire
  ttf: number;

  public constructor(protected readonly game:IGame, protected readonly coolDown:number){
    this.ttf = 0
  }

  public update(dT:number){
    if (this.ttf>0){
    this.ttf-=dT
    }
    else{
      this.ttf = 0
    }
  }

  public fire(owner:Player){
    if (this.ttf <= 0){
      this.doFire(owner);
      this.ttf = this.coolDown
    }
  }

  protected abstract doFire(owner:IShooter):void




}