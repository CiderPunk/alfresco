import "@babylonjs/core/Loading/loadingScreen"
import "@babylonjs/loaders/glTF"
import "@babylonjs/core/Meshes/meshBuilder"

//import "@babylonjs/core/Debug/debugLayer"; // Augments the scene with the debug methods
//import "@babylonjs/inspector"; // Injects a local ES6 version of the inspector to prevent automatically relying on the none compatible version


import { AssetContainer } from "@babylonjs/core/assetContainer"
import { Engine } from "@babylonjs/core/Engines/engine"
import { Scene } from "@babylonjs/core/scene"
import { AssetsManager } from "@babylonjs/core/Misc/assetsManager"
import { Player } from "./ents/player"
import { Vector3 } from "@babylonjs/core/Maths/math.vector"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode"
import { IEntity, IGame, IProjectile } from "./interfaces"
import { FastArray } from "./helpers/fastarray"
import * as planck from 'planck';
import * as  Constants from "./constants"
import { Bullet, BulletPool } from "./ents/bullet"
import { Ant, AntPool } from "./ents/ant"
import { Mesh } from "@babylonjs/core/Meshes/mesh"
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial"
import { TargetCamera } from "@babylonjs/core/Cameras/targetCamera"
import { Bounds } from "./ents/bounds"

import { CollisionGroup } from "./enums"
import { ScoreDisplay } from "./ui/scoredisplay"
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh"
import { Wasp, WaspPool } from "./ents/wasp"
import { angToVect2 } from "./helpers/mathutils";
import { Attributes, Component, ComponentChild, ComponentChildren, Ref } from "preact"
import { HealthBar } from "./ui/healthbar"


export type GameProps={
  //nothing here
}

export type GameState = {
  playerHealth:number
}

export class Game extends Component<GameProps, GameState> implements IGame{


  static readonly  initialSpawnProbability = 0.995
  static readonly spawnProbabilityRate:number = 0.000005


  canvas: HTMLCanvasElement
  engine: Engine
  scene: Scene
  container: AssetContainer
  reqAnimFrame: number
  lastFrame = 0
  camera: TargetCamera
  public rootNode: TransformNode
  player: Player


  ents: FastArray<IEntity>
  scratch: FastArray<IEntity>
  readonly world:planck.World
  protected tickTime: number
  bulletPool: BulletPool
  antPool: AntPool
  waspPool: WaspPool
  protected spawnProbability:number = Game.initialSpawnProbability

  resetGame: boolean
  scoreDisplay: ScoreDisplay
  gameActive: boolean
  score = 0
  gameTime = 0
  picnicMesh: AbstractMesh


  constructor(props:GameProps){
    super(props)

    this.state = {
      playerHealth:1
    }

    this.componentDidMount = ()=>{ 
      this.init()
    }
    this.componentWillUnmount= ()=>{

    }
    this.world = new planck.World()
    this.world.on("begin-contact",this.contact)
  }

  setPlayerHealth(val: number) {
    this.setState({ playerHealth: val})
  }


  init() {
    this.canvas = document.createElement('canvas') as HTMLCanvasElement
    this.base.appendChild(this.canvas)
    this.engine = new Engine(this.canvas)
    this.scene = new Scene(this.engine)
    this.scene.useRightHandedSystem = true
    const assetMan = new AssetsManager(this.scene)
    this.container = new AssetContainer(this.scene)
    this.rootNode = new TransformNode("root", this.scene)
    this.tickTime = 0
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
    document.addEventListener("keydown", (e:KeyboardEvent) =>{ this.keyDownHandler(e) }, false);
  }


  keyDownHandler(e: KeyboardEvent) {
    //console.log(e.key)
    switch (e.key){
      case "F2":
        console.log("debug layer")
      //  this.scene.debugLayer.show()
        break

    }
  }
  addScore(points: number) {
    this.score+=points
    this.scoreDisplay.setScore(this.score)
  }
  gameOver() {
    this.gameActive = false
    this.spawnProbability =  100000
  }

  reset(): void {
    this.resetGame = true
  }

  public addEnt(ent:IEntity){
    this.ents.push(ent)
  }

  protected contact(contact: planck.Contact): void {
    const ent1 = contact.getFixtureA().getBody().getUserData() as IEntity;
    const ent2 = contact.getFixtureB().getBody().getUserData() as IEntity;

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

  public spawnWasp():Wasp {
    const wasp = this.waspPool.GetNew()
    this.ents.push(wasp)
    return wasp
  }


  public spawnBullet():Bullet {
    const bullet = this.bulletPool.GetNew()
    this.ents.push(bullet)
    return bullet
  }

  initScene():void {

    this.scoreDisplay = new ScoreDisplay()

    this.container.moveAllFromScene()
    this.camera = new TargetCamera("Camera1", new Vector3(0,0,100), this.scene, true)    
    this.camera.position.set(0,70,70 )
    //this.camera.position.set(0,20,20 )
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
    this.waspPool = new WaspPool(this)

    this.player = new Player(this, new Vector3(0,0,0))
    
    //this.camera.lockedTarget = this.player
    
    this.addEnt(this.player)
    this.addEnt(new Bounds(this, {x:8,y:7}, CollisionGroup.player))
    this.addEnt(new Bounds(this, {x:20,y:20}, CollisionGroup.projectile))

    const picnic =    this.picnicMesh.clone("picnic", this.rootNode, false)
    picnic.scaling.scaleInPlace(1.5)
    picnic.rotationQuaternion = null
    picnic.rotation.set(0,0.45,0)
    picnic.position.y-=0.1

    this.gameActive = true
    //paint our first frame!
    this.doFrame()
  }

  doReset(){
    let ent:IEntity  
    while(ent = this.ents.pop()){
      if (ent.reset()){
        //moce ents to scratch if they persist
        this.scratch.push(ent)
      }
    }
    this.ents.swap(this.scratch)
    this.spawnProbability = Game.initialSpawnProbability 
    this.gameActive = true
    this.score = 0
    this.gameTime = 0
    this.scoreDisplay.setScore(0)
    this.scoreDisplay.setTime(0)

  }

  protected doFrame():void{

    if (this.resetGame){
      this.resetGame = false
      this.doReset()
    }

    //queue up next frame
    this.reqAnimFrame = window.requestAnimationFrame(()=>{this.doFrame()})
    
    //render the last prepped frame
    this.engine.beginFrame()
    this.scene.render()
    this.engine.endFrame()

    //get time and last time..
    if (this.gameActive){    
      this.scoreDisplay.setTime(this.gameTime)    
    }

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

      this.spawnProbability -= Game.spawnProbabilityRate
      //do we spawn a new ant?


      if (Math.random() > this.spawnProbability){

        if (Math.random() > 0.75){
          const wasp = this.spawnWasp()
           wasp.init(angToVect2(Math.random() * 2 * Math.PI, 15), this.player, 30)
        }
        else{
          const ant = this.spawnAnt()
          ant.init(angToVect2(Math.random() * 2 * Math.PI, 15), this.player, 30)
        }
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

      if (this.gameActive){
        
        
        this.world.step(Constants.TickLength )
      }
      this.tickTime+= (Constants.TickLength * 1000)
      
      this.gameTime += Constants.TickLength


    }

    this.ents.forEach((ent:IEntity)=>ent.preDraw(dt)) 
    
  }




  render(): ComponentChild {
    return (
    
    <div className="gameContainer"> 
      <HealthBar health={this.state.playerHealth}/>
    </div>)
  }


  private loadAssets(assMan:AssetsManager){
    Player.LoadAssets(assMan)
    Ant.LoadAssets(assMan, this.scene)
    Wasp.LoadAssets(assMan, this.scene)

    const task =assMan.addMeshTask("picnic", "", "assets/","picnic.gltf")
    task.onSuccess = (task)=>{
      this.picnicMesh = task.loadedMeshes[0]
    }
  }


}