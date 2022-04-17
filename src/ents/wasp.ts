import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { AssetContainer } from "@babylonjs/core/assetContainer";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Scene } from "@babylonjs/core/scene";
import { Vec2, World } from "planck";
import planck = require("planck");
import { CollisionGroup, EntityType } from "../enums";
import { lerpLimit, vectToAngle, vectToAngleInv } from "../helpers/mathutils";
import { cloneAnim } from "../helpers/meshhelpers";
import { Pool, PooledItem } from "../helpers/pool";
import { IV2, IEntity, IPooledItem, IGame,  IKillable } from "../interfaces";
import { Entity } from "./entity";
import { Killable } from "./killable";

export class WaspPool extends Pool<Wasp>{
  constructor(game:IGame){
    super(game, "wasp_", Wasp.GetNew )
  }
}

export class Wasp extends Killable implements IPooledItem<Wasp>, IKillable{

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
  stingTime: number = 0
  stingCooldown: number = 0


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
    this.flyAnim.start(true)
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

    fix.setFilterData({groupIndex: 1, categoryBits:CollisionGroup.enemy, maskBits:CollisionGroup.player|CollisionGroup.projectile})
    body.setSleepingAllowed(false)
    body.setLinearDamping(10)
    return body
  }

  collision(other: IEntity) {

  }

  prePhysics(dT: number): boolean {

    if (this.target.alive){
      
      this.diff.set(this.target.getPosition().x, this.target.getPosition().y).sub(this.body.getPosition())
      const angleToTarget = vectToAngleInv(this.diff) +(Math.PI * 0.5)
      let angleDiff = angleToTarget - this.body.getAngle()
      angleDiff += angleDiff > Math.PI ? -Math.PI : angleDiff < -Math.PI ? Math.PI : 0
      
      this.body.applyTorque(angleDiff)
      //this.body.
   


      if (this.stingCooldown > 0){
        this.stingCooldown -= dT
      }
      if (this.stingTime > 0){
        this.stingTime -= dT
        if (this.stingTime < 0){ 
          console.log("sting hit")
          this.stingTime = 0
          if (this.diff.lengthSquared() < 2){
            this.target.hurt(0, this, "stung")
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