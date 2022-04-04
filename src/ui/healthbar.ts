export class HealthBar{
  bar: HTMLDivElement
  constructor(){
    const container = document.getElementById("overlay")
    const outer =  document.createElement("div") as HTMLDivElement
    outer.id= "healthBar"
    this.bar =  document.createElement("span") as HTMLDivElement
    
    this.bar.style.width = `100%`
    outer.append(this.bar)
    container.append(outer)
  }

  updateHealth(val:number){
    this.bar.style.width = `${val * 100}%`
  }
}