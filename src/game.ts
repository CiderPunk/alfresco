import "@babylonjs/core/Loading/loadingScreen"
import "@babylonjs/loaders/glTF"
import "@babylonjs/core/Meshes/meshBuilder"

import { AssetContainer } from "@babylonjs/core/assetContainer"
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"
import { Player } from "./ents/player"
import { Vector3 } from "@babylonjs/core/Maths/math.vector"
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode"
import { IEntity, IGame, IProjectile } from "./interfaces"
import { FastArray } from "./helpers/fastarray"
import * as planck from 'planck';
import { Constants } from "./constants"
import { Bullet, BulletPool } from "./ents/bullet"
import { Ant, AntPool } from "./ents/ant"
import { Mesh } from "@babylonjs/core/Meshes/mesh"
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial"
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera"
import { Camera } from "@babylonjs/core/Cameras/camera"
import { Bounds } from "./ents/bounds"
import { Vec2 } from "planck"
import { angToVect } from "./helpers/mathutils"

export class Game implements IGame{

  readonly canvas: HTMLElement
  engine: Engine
  scene: Scene
  container: AssetContainer
  reqAnimFrame: number
  lastFrame: number = 0
  camera: TargetCamera
  public readonly rootNode: TransformNode
  player: Player


  ents: FastArray<IEntity>
  scratch: FastArray<IEntity>
  readonly world:planck.World
  protected tickTime: number
  bulletPool: BulletPool
  antPool: AntPool

  constructor(canvasId:string){
    this.canvas = document.getElementById(canvasId)
    this.engine = new Engine(this.canvas as HTMLCanvasElement)
    this.scene = new Scene(this.engine)
    this.scene.useRightHandedSystem = true
    const assetMan = new AssetsManager(this.scene)
    this.container = new AssetContainer(this.scene)
    this.rootNode = new TransformNode("root", this.scene)
    
    this.tickTime = 0
    this.world = new planck.World()
    this.world.on("begin-contact",this.contact)

    // The canvas/window resize event handler.
    window.addEventListener("resize", () => {
      this.engine.resize();
    })

    this.ents = new FastArray<IEntity>()
    this.scratch = new FastArray<IEntity>()

    this.loadAssets(assetMan)
    assetMan.load()

    assetMan.onFinish = ()=>{ 
      this.initScene()
    }
  }


  public addEnt(ent:IEntity){
    this.ents.push(ent)
  }


  protected contact(contact: planck.Contact): void {
    var ent1 = contact.getFixtureA().getBody().getUserData() as IEntity;
    var ent2 = contact.getFixtureB().getBody().getUserData() as IEntity;

//contact.getTangentSpeed()

    if (ent1 && ent2){
      //TODO: check for bullets....
      ent1.collision(ent2)
      ent2.collision(ent1)
    }    
  }

  public spawnAnt():Ant {
    const ant = this.antPool.GetNew()
    this.ents.push(ant)
    return ant
  }

  public spawnBullet():Bullet {
    const bullet = this.bulletPool.GetNew()
    this.ents.push(bullet)
    return bullet
  }

  
  initScene():void {

    this.container.moveAllFromScene()
    this.camera = new TargetCamera("Camera1", new Vector3(0,0,100), this.scene, true)

    
    this.camera.position.set(0,70,70 )
    this.camera.fov = 0.11
   
    this.camera.setTarget(new Vector3(0,0,0))


    const ground = Mesh.CreateGround("ground",50,50,2,this.scene,false)
    const groundMat =  new StandardMaterial("ground_mat", this.scene) 
    groundMat.emissiveColor.set(0.2,0.5,0.3)
    ground.material = groundMat

    //const sphere = Mesh.CreateSphere("testsphere", 16, 30, this.scene)
    //sphere.setAbsolutePosition(new Vector3(0,0,0))

    this.bulletPool = new BulletPool(this)
    this.antPool = new AntPool(this)

    this.player = new Player(this, new Vector3(0,0,0))
    
    //this.camera.lockedTarget = this.player
    
    this.addEnt(this.player)

    this.addEnt(new Bounds(this, {x:8,y:7}))




    //paint our first frame!
    this.doFrame()
  }


  protected doFrame():void{


    //queue up next frame
    this.reqAnimFrame = window.requestAnimationFrame(()=>{this.doFrame()})
      

    //render the last prepped frame
    this.engine.beginFrame()
    this.scene.render()
    this.engine.endFrame()


    //get time and last time..
    const  time:number = performance.now()
    const dt = time - this.lastFrame
    this.lastFrame = time

    //how far behind realtime is tick time
    const delta = time - this.tickTime
    //skip if we're really late..
    if (delta > 200){
      this.tickTime = time
    }

    while(this.tickTime < time){

      //do we spawn a new ant?
      if (Math.random() > 0.992){
        const ant = this.spawnAnt()
        ant.init(angToVect(Math.random() * 2 * Math.PI, 10), this.player, 30)
      }



      let ent:IEntity  
      //pre-phys all our ents
      while(ent = this.ents.pop()){
        if (ent.prePhysics(Constants.TickLength * 1000)){
          //moce ents to scratch if they persist
          this.scratch.push(ent)
        }
      }
      //swap scratch for main ent list...
      this.ents.swap(this.scratch)
      //physics step
      this.world.step(Constants.TickLength )
      this.tickTime+= (Constants.TickLength * 1000)
    }

    this.ents.forEach((ent:IEntity)=>ent.preDraw(dt)) 
    
  }



  private loadAssets(assMan:AssetsManager){
   Player.LoadAssets(assMan)
   Ant.LoadAssets(assMan)
  }


}