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
import { vectToAngle } from "../helpers/mathutils";
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
  biteTime: number = 0
  biteCooldown: number = 0





  public constructor(name:string, game:IGame, private pool:WaspPool){
    super(game, {x:0, y:0},0,Wasp.initHealth)
     //pooled entities gotta start innactive
    this.body.setActive(false)

    const newNodes = Wasp.container.instantiateModelsToScene(sn=>(name+"_"+sn), false)  

    this.mesh = newNodes.rootNodes[0] as AbstractMesh
    this.flyAnim = newNodes.animationGroups.find(g=>g.name="fly")
    this.idleAnim = newNodes.animationGroups.find(g=>g.name="idle")
    this.stingAnim = newNodes.animationGroups.find(g=>g.name="stinga")

    //this.mesh = Wasp.waspMeshNode.clone(name + '_mesh', game.rootNode, false)
    //this.mesh.skeleton = Wasp.waspMeshNode.skeleton
    //this.mesh.rotationQuaternion = null

    //this.flyAnim = cloneAnim(Wasp.animations.get("fly"), name+"_anim_fly", this.mesh)
    //this.idleAnim = cloneAnim(Wasp.animations.get("idle"), name+"_anim_idle", this.mesh)
    //this.stingAnim = cloneAnim(Wasp.animations.get("sting"), name+"_anim_sting", this.mesh)
    this.mesh.setEnabled(false)    
  }

  public init(position:IV2, target:IKillable, health:number){
    this.health = health
    this.target = target
    this.body.setPosition(Wasp.pos.set(position.x, position.y))
    this.body.setActive(true)
    this.mesh.setEnabled(true)
    this.flyAnim.start(true)
    this.idleAnim.start(true)


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
    this.biteCooldown = 0
    this.biteTime = 0
  }

  createBody(world: World, position: IV2, orientation: number) {
    const body = world.createBody({type: planck.Body.DYNAMIC,position: new planck.Vec2(position), angle: orientation, angularDamping:2})
    const shape = new planck.Circle(0.7)
    const fix = body.createFixture({shape: shape, restitution:0.1, density:0.5})

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
      if (this.biteCooldown > 0){
        this.biteCooldown -= dT
      }
      if (this.biteTime > 0){
        this.biteTime -= dT
        if (this.biteTime < 0){ 
          console.log("sting hit")
          this.biteTime = 0
          if (this.diff.lengthSquared() < 2){
            this.target.hurt(0, this, "stung")
          }
        }
      }
      

      if (this.biteCooldown <= 0 && this.diff.lengthSquared() < 2){
        this.biteTime = 150
        this.biteCooldown  = 400
        console.log("start sting!")
        this.idleAnim.stop()
        this.stingAnim.start(false)
      }

      this.diff.normalize()
      this.diff.mul(20)
      this.body.applyForceToCenter(this.diff)
      
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
    this.mesh.rotation.set(0, (Math.PI / 2) -vectToAngle(  this.diff ), 0 )
  }

  get type(): EntityType {
    return EntityType.enemy
  }


  public static GetNew(name:string, game:IGame, pool:WaspPool ):Wasp{
    return new Wasp(name, game, pool)
  }


  static LoadAssets(assMan:AssetsManager, scene:Scene){
    const task = assMan.addMeshTask("loadant","","assets/", "wasp.gltf")
    task.onSuccess = (task)=>{ 
      const waspMesh = task.loadedMeshes[0].getChildTransformNodes()[0]
      //Wasp.waspMeshNode = root.getChildMeshes(true,n=>n.id == "wasp")[0] as AbstractMesh
      //Wasp.animations = new Map<string,AnimationGroup>()
      //const waspMesh = root.getChildTransformNodes[0] as AbstractMesh
      Wasp.container = new AssetContainer(scene)
  
      Wasp.container.meshes.push(task.loadedMeshes[0])
      Wasp.container.skeletons.push(task.loadedSkeletons[0])
      task.loadedAnimationGroups.forEach(a=>{ Wasp.container.animationGroups.push(a)})
    }
  } 


}