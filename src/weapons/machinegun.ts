import { angToVect } from "../helpers/mathutils";
import { IGame, IShooter } from "../interfaces";
import { Weapon } from "./weapon";

export class MachineGun extends Weapon{

  public constructor(game:IGame, shotRate = 50, readonly bulletSpeed=20, readonly spread = 0.05, readonly damagePerShot = 5){
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
    const bullet = this.game.spawnBullet()

    bullet.init(pos,angToVect(angle + ((Math.random() - 0.5) * this.spread), this.bulletSpeed), shooter, this.damagePerShot)
  }


}

