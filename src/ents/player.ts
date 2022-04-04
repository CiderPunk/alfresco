
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup"
import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode"
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"
import { LocalControl } from "../controls/localcontrol"
import { IController, IDamageable, IEntity, IGame, IShooter, IV2, IWeapon } from "../interfaces"
import { lerpLimit, vectToAngle } from "../helpers/mathutils"
import { Entity } from "./entity"
import { cloneAnim } from "../helpers/meshhelpers"
import { ShotGun } from "../weapons/shotgun"
import { CollisionGroup, EntityType } from "../enums"
import planck = require("planck")
import { Vec2 } from "planck"
import { Killable } from "./killable"
import { MachineGun } from "../weapons/machinegun"


export class Player extends Killable implements IShooter,  IDamageable{


  protected static lowerMesh:TransformNode
  protected static upperMesh:TransformNode
  static animations: Map<string,AnimationGroup>
  lower: TransformNode
  upper: TransformNode
  controller: IController
  vel:Vec2
  animGroup: AnimationGroup
  walkAnim: AnimationGroup
  standAnim: AnimationGroup
  idleAnim: AnimationGroup
  shootAnim: AnimationGroup
  weapon: IWeapon
  private _groupIndex: number

  get type(): EntityType { return EntityType.player }
  
  get position(): Vector3 {
    return this.lower.position
  }

  get fireVect(): IV2 {
    return this.controller.joyAim
  }
  get rotation(): number {
    return vectToAngle(this.fireVect)
  }



  public createBody(world:planck.World, position:IV2,  orientation:number){
    this._groupIndex = -1
    const body = world.createBody({type: planck.Body.DYNAMIC,position: new planck.Vec2(position), angle: orientation, angularDamping:2})
    const shape = new planck.Circle(0.3)
    const fix = body.createFixture({shape: shape, restitution:0.1, density:1})

    fix.setFilterData({groupIndex: this._groupIndex, categoryBits:CollisionGroup.player, maskBits:CollisionGroup.enemy| CollisionGroup.boundary })
    body.setSleepingAllowed(false)
    body.setLinearDamping(10)
    return body
  }


  collision(other: IEntity) {
   // throw new Error("Method not implemented.")
  }


  get groupIndex(): number {
    return this._groupIndex
  }


  constructor(game:IGame, location:IV2){
    super(game,location,0,100)
    this.lower = Player.lowerMesh.clone("playerlower", game.rootNode, false)
    this.upper = Player.upperMesh.clone("playerupper", game.rootNode, false)

    this.upper.rotationQuaternion = null
    this.lower.rotationQuaternion = null

    this.walkAnim = cloneAnim(Player.animations.get("walk"), "playerwalk", this.lower)
    this.standAnim = cloneAnim(Player.animations.get("stand"), "playerstand", this.lower)
    this.idleAnim = cloneAnim(Player.animations.get("idle"), "playeridle", this.upper)
    this.shootAnim = cloneAnim(Player.animations.get("shoot"), "playershoot", this.upper)

    this.shootAnim.loopAnimation = false
    this.game.scene.addAnimationGroup(this.walkAnim)   
    this.game.scene.addAnimationGroup(this.standAnim)   
    this.game.scene.addAnimationGroup(this.idleAnim)     
    this.game.scene.addAnimationGroup(this.shootAnim)     

  
    this.standAnim.start(true)
    this.idleAnim.start(true)

    //WDscene.addTransformNode( this.lower )
    this.controller = new LocalControl(this)
    this.vel = new Vec2(0,0)

    this.weapon = new ShotGun(this.game)
    //this.weapon = new MachineGun(this.game)
  }



  fireAnimation(): void {
    this.shootAnim.start();
  }


  static force:Vec2 = new Vec2()

  prePhysics(dT: number): boolean {

    this.weapon.update(dT)
    this.controller.update()
    Player.force.set(this.controller.joySteer.x, this.controller.joySteer.y).mul(20)
/*
    const scale = 0.1
    this.vel.x = lerpLimit(this.vel.x, this.controller.joySteer.x,scale *dT);
    this.vel.y = lerpLimit(this.vel.y, this.controller.joySteer.y,scale * dT);
*/
    this.body.applyForceToCenter(Player.force)
    
    //.setLinearVelocity(this.vel.mul(4))
    
    //shooting
    if (this.controller.fire1){
      this.weapon.fire(this)
    }
    return true
  }


  preDraw(dt: number): void {


    const vel = this.body.getLinearVelocity()

    //animation and motion damping
    if (vel.lengthSquared() >0.1){
      this.walkAnim.start(true, 3)
      //turn lower in direction of motion
      const lowerAngle = vectToAngle(vel)
      this.lower.rotation.set(0,lowerAngle  + (Math.PI / 2),0)
    }
    else{
      if (this.walkAnim.isPlaying){
        this.walkAnim.stop()
        this.standAnim.start()
      }
    }


    //lower position 
    this.lower.position.set(this.getPosition().x,0, this.getPosition().y)
    this.upper.position.copyFrom(this.lower.position)

    //torso angle
    const upperAngle = vectToAngle(this.controller.joyAim)
    this.upper.rotation.set(0, upperAngle + (Math.PI / 2), 0 )

  }



  getScreenPosition():Vector2 {  
    //no mesh assigned yet
    const engine = this.game.scene.getEngine()

    const pos = Vector3.Project(
      this.lower.getAbsolutePosition(),
      Matrix.IdentityReadOnly,
      this.game.scene.getTransformMatrix(),
      this.game.scene.activeCamera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()))
    return new Vector2(pos.x, pos.y)
  }

  static LoadAssets(assMan:AssetsManager){
    const task = assMan.addMeshTask("loadpersonmesh","","assets/", "person.gltf")
    task.onSuccess = (task)=>{ 
      const root = task.loadedMeshes[0]
      Player.lowerMesh = root.getChildTransformNodes(true,n=>n.id == "lower")[0]
      Player.upperMesh = root.getChildTransformNodes(true,n=>n.id == "upper")[0]
      Player.animations = new Map<string,AnimationGroup>()
      task.loadedAnimationGroups.forEach(a=>{ Player.animations.set(a.name, a)})
    }
  } 



}