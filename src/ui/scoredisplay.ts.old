export class ScoreDisplay{
  score: HTMLSpanElement
  time: HTMLSpanElement

  constructor(){
    const overlay = document.getElementById("overlay")
    const container = document.createElement("div") as HTMLDivElement
    container.id = "scoredisplay"
    this.score = document.createElement("span") as HTMLSpanElement
    this.score.id="score"
    container.appendChild(this.score)
    this.time = document.createElement("span") as HTMLSpanElement
    this.time.id="time"
    container.appendChild(this.time)

    overlay.append(container)
  }

  public setTime(val:number){
    this.time.innerText = val.toFixed(2)
  }

  public setScore(val:number){
    this.score.innerText = val.toString()
  }

}