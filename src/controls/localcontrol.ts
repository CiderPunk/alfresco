import { Vector2 } from "@babylonjs/core/Maths/math.vector";
import { Player } from "../ents/player";
import { IController, IV2 } from "../interfaces";

export class LocalControl implements IController{
 
  public joySteer: Vector2 
  public joyAim: Vector2
  public fire1: boolean 
  
  keystate:Map<string, boolean>
  keydir: Vector2
  mousePos:Vector2

  constructor(readonly player:Player){
    document.addEventListener("keydown", (e:KeyboardEvent) =>{ this.keyDownHandler(e) }, false);
    document.addEventListener("keyup", (e:KeyboardEvent) =>{ this.keyUpHandler(e) }, false);
    this.keydir = new Vector2()
    this.joySteer = new Vector2()
    this.joyAim = new Vector2()
    this.fire1 = false
    this.keystate = new Map<string, boolean>()
    this.mousePos = new Vector2()
    document.addEventListener("mousemove", (e:MouseEvent)=>{ this.mouseHandler(e) })

    document.addEventListener("mousedown", (e:MouseEvent)=>{ 
      this.fire1 = true
      e.stopPropagation()
     })

     document.addEventListener("mouseup", (e:MouseEvent)=>{ 
      this.fire1 = false
      e.stopPropagation()
     })
  }

  update():void {
    this.joyAim.copyFrom(this.player.getScreenPosition().subtract(this.mousePos).normalize())
    this.joyAim.x = -this.joyAim.x
  }

  mouseHandler(e: MouseEvent) {
    this.mousePos.set(e.clientX, e.clientY)  
  }


  keyDownHandler(e: KeyboardEvent) {
    //console.log(e.keyCode)
    const key = e.code
    //if already held down, skip
    if (this.keystate[key]){
      return
    }

    this.keystate[key] = true
    switch (key){
      case "KeyD":
        this.keydir.x+=1
   //     console.log("move right")
        break;
      case "KeyA":
        this.keydir.x-=1
    //    console.log("move left")
        break;
      case "KeyS":
        this.keydir.y+=1
    //    console.log("move down")
        break;
      case "KeyW":
        this.keydir.y-=1
    //    console.log("move up")
        break;
    }
    this.joySteer.set(this.keydir.x, this.keydir.y).normalize()
  }

  keyUpHandler(e: KeyboardEvent) {
    //console.log(e.keyCode)
    const key = e.code 
    //if already held down, skip
    if (!this.keystate[key]){
      return
    }
    this.keystate[key] = false
    switch (key){

      case "KeyD":
        this.keydir.x-=1
        break;
      case "KeyA":
        this.keydir.x+=1
        break;
      case "KeyS":
        this.keydir.y-=1
        break;
      case "KeyW":
        this.keydir.y+=1
        break;
    }
    this.joySteer.set(this.keydir.x, this.keydir.y).normalize()
  }

  
}