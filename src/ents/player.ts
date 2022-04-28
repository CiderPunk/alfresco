import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup"
import { Matrix, Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode"
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"
import { LocalControl } from "../controls/localcontrol"
import { IController,  IEntity, IGame, IKillable, IShooter, IV2, IWeapon } from "../interfaces"
import { vectToAngle, vectToAngleInv } from "../helpers/mathutils"
import { cloneAnim } from "../helpers/meshhelpers"
import { ShotGun } from "../weapons/shotgun"
import { CollisionGroup, EntityType } from "../enums"
import planck = require("planck")
import { Vec2 } from "planck"
import { Killable } from "./killable"
import { AssetContainer } from "@babylonjs/core/assetContainer"
import { Scene } from "@babylonjs/core/scene"


export class Player extends Killable implements IShooter,  IKillable{

  static readonly playerHealth = 100
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
  dieUpper: AnimationGroup
  dieLower: AnimationGroup
  static container: AssetContainer

  public getHealth():number{ return this.health / Player.playerHealth}
  

  hurt(energy: number, other: IEntity, type: string) {
    super.hurt(energy, other, type)
    this.game.setPlayerHealth( this.getHealth())
  }

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

  public reset():boolean{
    this.health = Player.playerHealth
    this.alive = true
    this.body.setPosition(new Vec2(0,0))
    this.body.setActive(true)
    this.dieLower.stop()
    this.dieUpper.stop()
    this.standAnim.start(true)
    this.idleAnim.start(true)
    this.game.setPlayerHealth(1)
    return true
  }

  collision(other: IEntity) {
   // throw new Error("Method not implemented.")
  }

  get groupIndex(): number {
    return this._groupIndex
  }

  constructor(name:string, game:IGame, location:IV2){
    super(game,location,0,Player.playerHealth)
    const nodes = Player.container.instantiateModelsToScene(sn=>(name+"_"+sn),false)

    this.lower = nodes.rootNodes[0].getChildTransformNodes(false, n=>n.name.endsWith('lower'))[0]
    this.upper = nodes.rootNodes[0].getChildTransformNodes(false, n=>n.name.endsWith('upper'))[0]

    //this.lower = Player.lowerMesh.clone("playerlower", game.rootNode, false)
    //this.upper = Player.upperMesh.clone("playerupper", game.rootNode, false)

    const gunleft = this.upper.getChildMeshes(false, n=>n.name.endsWith("gun_left"))[0]

    gunleft.setEnabled(false)

    this.upper.rotationQuaternion = null
    this.lower.rotationQuaternion = null

    this.walkAnim = nodes.animationGroups.find(ag=>ag.name == "walk")
    this.standAnim = nodes.animationGroups.find(ag=>ag.name == "stand")
    this.dieLower = nodes.animationGroups.find(ag=>ag.name == "die-lower")
    this.dieUpper = nodes.animationGroups.find(ag=>ag.name == "die-upper")
    
    
    this.shootAnim = nodes.animationGroups.find(ag=>ag.name == "shoot")
    this.idleAnim = nodes.animationGroups.find(ag=>ag.name== "idle")
 //this.shootAnim = nodes.animationGroups.find(ag=>ag.name == "shoot-left")
 //this.idleAnim = nodes.animationGroups.find(ag=>ag.name== "idle-onehand")



    this.dieLower.stop()
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

    if (this.alive){
      this.weapon.update(dT)
      this.controller.update()
      Player.force.set(this.controller.joySteer.x, this.controller.joySteer.y).mul(20)
      this.body.applyForceToCenter(Player.force)
    
      //shooting
      if (this.controller.fire1){
        this.weapon.fire(this)
      }
    }
    return true
  }

  
  killed(): void {
    this.walkAnim.stop()
    this.shootAnim.stop()
    this.idleAnim.stop()
    this.standAnim.stop()

    this.dieLower.start(false)
    this.dieUpper.start(false)
    this.body.setActive(false)

    this.game.gameOver()
  }

  preDraw(dt: number): void {

    if (!this.alive){
      return
    }
    const vel = this.body.getLinearVelocity()

    //animation and motion damping
    if (vel.lengthSquared() >0.1){
      this.walkAnim.start(true, 3)
      //turn lower in direction of motion
      const lowerAngle = vectToAngleInv(vel)
      this.lower.rotation.set(0,lowerAngle  + (Math.PI / 2),0)
    }
    else{
      if (this.walkAnim.isPlaying){
        this.walkAnim.stop()
        this.standAnim.start(true)
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

  static LoadAssets(assMan:AssetsManager, scene:Scene){
    const task = assMan.addMeshTask("loadpersonmesh","","assets/", "person2.glb")
    task.onSuccess = (task)=>{ 
      Player.container = new AssetContainer(scene)
      Player.container.meshes.push(...task.loadedMeshes)
      Player.container.skeletons.push(...task.loadedSkeletons)
      Player.container.animationGroups.push(...task.loadedAnimationGroups)
      
      /*
      const root = task.loadedMeshes[0]
      Player.lowerMesh = root.getChildTransformNodes(true,n=>n.id == "lower")[0]
      Player.upperMesh = root.getChildTransformNodes(true,n=>n.id == "upper")[0]
      Player.animations = new Map<string,AnimationGroup>()
      task.loadedAnimationGroups.forEach(a=>{ Player.animations.set(a.name, a)})
      */
    }
  } 

}