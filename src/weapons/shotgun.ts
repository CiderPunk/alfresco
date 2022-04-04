import { Vec2 } from "planck";
import { angToVect } from "../helpers/mathutils";
import { IGame, IShooter } from "../interfaces";
import { Weapon } from "./weapon";

export class ShotGun extends Weapon{

  public constructor(game:IGame, shotRate = 500, readonly bulletSpeed=15,
    readonly damagePerShot = 5, readonly shotCount = 5, 
    readonly spread = 0.2, readonly speedVariance = 1){
    super(game,shotRate)
    
  }


  protected doFire(shooter:IShooter):void {
    console.log("bang")
    shooter.fireAnimation()
    
    const angle = -shooter.rotation 
    const pos = shooter.getPosition()
    const fireVect = shooter.fireVect

    //coorect shots to comeout of the barrel...maybe
    pos.x+= fireVect.y * 0.2
    pos.y+= fireVect.x * 0.2
    //pos.y+= fireVect.x
    for (let i = 0;  i < this.shotCount; i++){
    const bullet = this.game.spawnBullet()

      const v = new Vec2()
      //const vec = new Vec2(shooter.direction.x, shooter.direction.y).mul(20)  




      bullet.init(pos, angToVect(angle + ((Math.random() - 0.5) * this.spread), this.bulletSpeed + ((Math.random() - 0.5) * this.speedVariance)), shooter, this.damagePerShot)
    }

  }


}

