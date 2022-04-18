import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { Vec2, World } from "planck";
import planck = require("planck");
import { CollisionGroup, EntityType } from "../enums";
import { angToVect2, vectToAngleInv } from "../helpers/mathutils";
import { Pool } from "../helpers/pool";
import { IV2, IEntity, IPooledItem, IGame,  IKillable } from "../interfaces";

import { Killable } from "./killable";

export class WaspPool extends Pool<Wasp>{
  constructor(game:IGame){
    super(game, "wasp_", Wasp.GetNew )
  }
}

export class Wasp extends Killable implements IPooledItem<Wasp>, IKillable{


  static readonly onTargetAngle = 0.5
  static readonly onTargetForce = 15
  static readonly offTargetForce = 5
  static readonly fastTurnRate = 0.1
  static readonly slowFurnForce = 0.4
  static readonly linearDamping = 4
  


  static readonly initHealth =40
  static readonly points = 200
  static container:AssetContainer

  static waspMeshNode: AbstractMesh;
  static animations: Map<string, AnimationGroup>
  mesh: AbstractMesh

  flyAnim: AnimationGroup
  idleAnim: AnimationGroup
  stingAnim: AnimationGroup
  
  static pos = new Vec2()
  
  target:IKillable
  diff: Vec2 = new Vec2()
  stingTime = 0
  stingCooldown = 0
  force:Vec2 = new Vec2()

  public constructor(name:string, game:IGame, private pool:WaspPool){
    super(game, {x:0, y:0},0,Wasp.initHealth)
     //pooled entities gotta start innactive
    this.body.setActive(false)
    const newNodes = Wasp.container.instantiateModelsToScene(sn=>(name+"_"+sn), false)  
    this.mesh = newNodes.rootNodes[0] as AbstractMesh

    this.flyAnim = newNodes.animationGroups[0]
    this.idleAnim = newNodes.animationGroups[1]
    this.stingAnim = newNodes.animationGroups[2]

    this.mesh.setEnabled(false)    
  }

  public init(position:IV2, target:IKillable, health:number){
    this.health = health
    this.target = target
    Wasp.pos.set(position.x, position.y)


    this.body.setPosition(Wasp.pos.set(position.x, position.y))
    this.body.setActive(true)

    //angle to target
    this.diff.set(this.target.getPosition().x, this.target.getPosition().y).sub(this.body.getPosition())
    this.body.setAngle(vectToAngleInv(this.diff) +(Math.PI * 0.5))

    this.mesh.setEnabled(true)
    this.flyAnim.start(true,1.5)
    this.idleAnim.start(true)
    //this.stingAnim.start(true)


//his.stingAnim.start(true)

    this.alive = true
  }
 
  reset(): boolean {
    this.Free()
    return false
  }


  Free():void{    
    this.CleanUp()
    this.pool.Release(this)
  }
  CleanUp():void{
    this.flyAnim.stop()
    this.stingAnim.stop()
    this.mesh.setEnabled(false)
    this.body.setActive(false)
    this.stingCooldown = 0
    this.stingTime = 0
  }

  createBody(world: World, position: IV2, orientation: number) {
    const body = world.createBody({type: planck.Body.DYNAMIC,position: new planck.Vec2(position), angle: orientation, angularDamping:2})
    const shape = new planck.Circle(0.4)
    const fix = body.createFixture({shape: shape, restitution:0.1, density:1})

    fix.setFilterData({groupIndex: 2, categoryBits:CollisionGroup.flyers, maskBits:CollisionGroup.player|CollisionGroup.projectile})
    body.setSleepingAllowed(false)
    body.setLinearDamping(Wasp.linearDamping)
    return body
  }

  collision(other: IEntity) {
    //do nothing
  }



  

  prePhysics(dT: number): boolean {
    if (this.target.alive){
      this.diff.set(this.target.getPosition().x, this.target.getPosition().y).sub(this.body.getPosition())
      const angleToTarget = vectToAngleInv(this.diff) +(Math.PI * 0.5)
      const facing = this.body.getAngle()
      const vel = this.body.getLinearVelocity()
      const speed = vel.lengthSquared()
      
      let angleDiff = angleToTarget - facing
      angleDiff += angleDiff > Math.PI ? -(2 * Math.PI) : angleDiff < -Math.PI ? (2*Math.PI) : 0
 
      const acc = Math.abs(angleDiff) > Wasp.onTargetAngle ? Wasp.offTargetForce : Wasp.onTargetForce
      const turn = speed > 10 ?  Wasp.fastTurnRate : Wasp.slowFurnForce 
    
      this.body.applyTorque( angleDiff > 0 ? turn : -turn)
      this.body.applyForceToCenter(angToVect2(facing, acc, this.force) as Vec2)

      if (this.stingCooldown > 0){
        this.stingCooldown -= dT
      }
      if (this.stingTime > 0){
        this.stingTime -= dT
        if (this.stingTime < 0){ 
          console.log("sting hit")
          this.stingTime = 0
          if (this.diff.lengthSquared() < 2){
            this.target.hurt(20, this, "stung")
          }
        }
      }

      if (this.stingCooldown <= 0 && this.diff.lengthSquared() < 2){
        this.stingTime = 150
        this.stingCooldown  = 400
        console.log("start sting!")
        this.stingAnim.start(false)
      }

   
      
    }
    else{
     // this.flyAnim.stop()

    }
    if (! this.alive){
      this.mesh.setEnabled(false)
      this.Free()
      return false
    }

    return true
  }


  killed(other:IEntity): void {
    this.game.addScore(Wasp.points)
  }


  preDraw(dt: number): void {
    this.mesh.position.set(this.getPosition().x,1, this.getPosition().y)
    // angle
    this.mesh.rotation.set(0, this.body.getAngle(), 0 )
  }

  get type(): EntityType {
    return EntityType.enemy
  }


  public static GetNew(name:string, game:IGame, pool:WaspPool ):Wasp{
    return new Wasp(name, game, pool)
  }


  static LoadAssets(assMan:AssetsManager, scene:Scene){
    //const task = assMan.addMeshTask("mesh", null, "https://raw.githubusercontent.com/CiderPunk/alfresco/main/dist/assets/", "wasp.gltf")
      
    const task = assMan.addMeshTask("loadant","","assets/", "wasp.gltf")
    task.onSuccess = (task)=>{ 
      Wasp.container = new AssetContainer(scene)
      Wasp.container.meshes.push(...task.loadedMeshes)
      Wasp.container.skeletons.push(...task.loadedSkeletons)
      Wasp.container.animationGroups.push(...task.loadedAnimationGroups)
    }
  } 


}