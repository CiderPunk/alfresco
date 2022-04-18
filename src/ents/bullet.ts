import "@babylonjs/core/Meshes/meshBuilder"

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { InstancedMesh } from "@babylonjs/core/Meshes/instancedMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CollisionGroup, EntityType } from "../enums";
import { Pool } from "../helpers/pool";
import { IEntity, IGame, IPooledItem, IProjectile,  IShooter, IsKillable, IV2 } from "../interfaces";
import { Entity } from "./entity";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { World } from "planck";
import planck = require("planck");



export class BulletPool extends Pool<Bullet>{

  constructor(game:IGame){
    super(game, "bullet_", Bullet.GetNew )
  }

}

export class Bullet extends Entity implements IPooledItem<Bullet>, IProjectile{


  //scratch vectors
  static readonly pos = new planck.Vec2
  static readonly vel = new planck.Vec2

  static _bulletMesh:Mesh  
  protected mesh:InstancedMesh
  protected alive: boolean
  private shooter: IShooter
  protected readonly fixture: planck.Fixture
  damage: number;


  static getBulletMesh(game:IGame):Mesh{
    if (!Bullet._bulletMesh){
      const bullet = Bullet._bulletMesh = Mesh.CreateSphere("shelltemplate", 5, 0.07, game.scene)
      const mat = new StandardMaterial("bullet",  game.scene)
      mat.emissiveColor = new Color3(0.7,0.7,0.7)
      bullet.material = mat
      bullet.setEnabled(false)
    }
    return Bullet._bulletMesh
  }


  createBody(world: World, position?: IV2, orientation?: number) {
    const body = world.createBody({  type: planck.Body.DYNAMIC })
    body.setBullet(true)
    body.setUserData(this)
    return body
  }


  collision(other: IEntity) {
    if (IsKillable(other)){
      other.hurt(this.damage, this.shooter, "armour piercing sabot")
    }
    //damage other
    this.alive = false
  }

  prePhysics(dT: number): boolean {
    if (!this.alive){
      this.Free()
    }
    return this.alive
  }

  preDraw(dt: number): void {
    const pos = this.body.getPosition()
    this.mesh.position.set(pos.x, 1.4, pos.y)
  }


  public init(position:IV2, velocity:IV2, shooter:IShooter, damage:number){
    this.damage = damage
    this.shooter = shooter
    this.body.setPosition(Bullet.pos.set(position.x, position.y))
    this.body.setLinearVelocity(Bullet.vel.set(velocity.x, velocity.y))
    this.body.setActive(true)
    this.fixture.setFilterData({ groupIndex:shooter.groupIndex, categoryBits:CollisionGroup.projectile , maskBits: CollisionGroup.all})

    if (!this.mesh){
      this.mesh = Bullet.getBulletMesh(this.game).createInstance(name+ "_mesh")
      this.game.scene.addMesh(this.mesh)
    }

    this.mesh.setEnabled(true)
    this.alive = true
  }
 
  get position(): Vector3 {
    return this.mesh.position
  }


  public constructor(name:string, game:IGame, private pool:BulletPool){
    super(game, {x:0, y:0})
     //store first fixture
     this.fixture = this.body.createFixture({shape: new planck.Circle(new planck.Vec2(0,0),0.3), density:5, restitution:0.1})
     //pooled entities gotta start innactive
     this.body.setActive(false)
     this.body.setBullet(true)
  }

  public static GetNew(name:string, game:IGame, pool:BulletPool ):Bullet{
    return new Bullet(name, game, pool)
  }


  get type(): EntityType { return EntityType.bullet }
  reset(): boolean {
    this.Free()
    return false
  }

  Free():void{
    this.CleanUp()
    this.pool.Release(this)
  }

  CleanUp(){
    this.mesh.setEnabled(false)
    this.body.setActive(false)
  }



}