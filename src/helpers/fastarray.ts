export class FastArray<T> implements Iterable<T>{

  private store:Array<T>
  private head:number

  public constructor(private initSize:number = 100, private growSize:number = 50){
    this.store = new Array<T>(this.initSize)
    this.reset()
  }

  public get length():number{
    return this.head
  }

  //empty array (and all references it might have)
  public reset(){
    //this.store = new Array<T>(this.initSize)
    this.head = 0
  }

  //empties array quickly
  public clear(){
    this.head = 0
  }
  public get(index:number){
    return index < this.head ? this.store[index] : undefined
  }

  public push(val:T){
    if (this.head == this.store.length){
      this.grow()
    }
    this.store[this.head++] = val
  }

  public pop(){
    if (this.head > 0){
      return this.store[--this.head]
    }
    return undefined
  }

  public indexOf(val:T) : number{
    for(let i = 0; i<this.head; i++){
      if (this.store[i] === val){
        return i
      }
    }
    return -1
  }

  public contains(val:T):boolean{
    return this.indexOf(val) > -1
  }

  private grow(){
    //create a new store
    const tempStore = new Array<T>(this.store.length + this.growSize)
    //copy everything from the old store
    for (let i = 0; i < this.store.length; i++){
      tempStore[i] = this.store[i]
    }
    //replace old store
    this.store = tempStore
  }

  public [Symbol.iterator]():Iterator<T>{
    let index = 0
    return {
      next: ()=>{
        return (index < this.head ? 
          {done:false, value:this.store[index++]} :
          {done:true, value:null})
      }
    } 
  }

  public forEach(cb:(obj:T)=>void){
    for(let i = 0; i<this.head; i++){
      cb(this.store[i])
    }   
  }

  /** Swaps contents of this array with target array */
  public swap(t:FastArray<T>){
    const tempStore = t.store
    const tempHead = t.head
    t.store = this.store
    t.head = this.head
    this.store = tempStore
    this.head = tempHead
  }
  public ToArray():Array<T>{
    return this.store.slice(0, this.length)
  }

}


