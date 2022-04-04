import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager";
import { Vec2, World } from "planck";
import planck = require("planck");
import { CollisionGroup, EntityType } from "../enums";
import { vectToAngle } from "../helpers/mathutils";
import { cloneAnim } from "../helpers/meshhelpers";
import { Pool, PooledItem } from "../helpers/pool";
import { IV2, IEntity, IPooledItem, IGame, IDamageable } from "../interfaces";
import { Entity } from "./entity";
import { Killable } from "./killable";

export class AntPool extends Pool<Ant>{
  constructor(game:IGame){
    super(game, "ant_", Ant.GetNew )
  }
}

export class Ant extends Killable implements IPooledItem<Ant>, IDamageable{

  static antMeshNode: TransformNode;
  static animations: Map<string, AnimationGroup>
  mesh: TransformNode;
  walkAnim: AnimationGroup;
  idleAnim: AnimationGroup;
  biteAnim: AnimationGroup;
  static pos = new Vec2()
  target: IEntity;
  diff: Vec2 = new Vec2()


  public constructor(name:string, game:IGame, private pool:AntPool){
    super(game, {x:0, y:0},0,40)
     //pooled entities gotta start innactive
    this.body.setActive(false)
    this.mesh = Ant.antMeshNode.clone(name + '_mesh', game.rootNode, false)
    this.mesh.rotationQuaternion = null
    this.walkAnim = cloneAnim(Ant.animations.get("walk"), name+"_anim_walk", this.mesh)
    this.idleAnim = cloneAnim(Ant.animations.get("idle"), name+"_anim_idle", this.mesh)
    this.biteAnim = cloneAnim(Ant.animations.get("bite"), name+"_anim_bite", this.mesh)
    this.mesh.setEnabled(false)    
  }


  public init(position:IV2, target:IEntity, health:number){
    this.health = health
    this.target = target
    this.body.setPosition(Ant.pos.set(position.x, position.y))
    this.body.setActive(true)
    this.mesh.setEnabled(true)
    this.walkAnim.start(true)
    this.idleAnim.start(true)
    this.alive = true
  }
 


  Free():void{    
    this.CleanUp()
    this.pool.Release(this)
  }
  CleanUp():void{
    this.walkAnim.stop()
    this.biteAnim.stop()
    this.mesh.setEnabled(false)
    this.body.setActive(false)
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
    this.diff.set(this.target.getPosition().x, this.target.getPosition().y).sub(this.body.getPosition())
    if (this.diff.lengthSquared() < 2){
      console.log("bite!")
      this.biteAnim.start()
    }



    this.diff.normalize()
    this.diff.mul(20)
    this.body.applyForceToCenter(this.diff)
    


    if (! this.alive){
      this.mesh.setEnabled(false)
      this.Free()
      return false
    }

    return true
  }
  preDraw(dt: number): void {

    //lower position 
    this.mesh.position.set(this.getPosition().x,1, this.getPosition().y)
    // angle
    this.mesh.rotation.set(0, (Math.PI / 2) -vectToAngle(  this.diff ), 0 )
  }
  get type(): EntityType {
    return EntityType.enemy
  }


  public static GetNew(name:string, game:IGame, pool:AntPool ):Ant{
    return new Ant(name, game, pool)
  }


  static LoadAssets(assMan:AssetsManager){
    const task = assMan.addMeshTask("loadant","","assets/", "ant.gltf")
    task.onSuccess = (task)=>{ 
      const root = task.loadedMeshes[0]
      Ant.antMeshNode = root.getChildTransformNodes(true,n=>n.id == "ant")[0]
      Ant.animations = new Map<string,AnimationGroup>()
      task.loadedAnimationGroups.forEach(a=>{ Ant.animations.set(a.name, a)})
    }
  } 


}