import { IGame, IPool, IPooledItem } from "../interfaces"
import { FastArray } from "./fastarray"


export abstract class PooledItem{
  pool:IPool = null
  
  CleanUp:()=>void

  Free(): void {
    this.CleanUp()
    this.pool.Release(this)
  }
}

export class Pool<T extends IPooledItem<T>> implements IPool{
  protected pool:FastArray<T>
  protected count = 1
  protected readonly options:any

  constructor( protected game:IGame, protected namePrefix:string,
    protected getNewItem:(name:string, game:IGame, pool:IPool, options:any)=>T, 
    protected customOptions:any = null, defaultOptions:any = null){
    this.options = { ...defaultOptions, ...customOptions}
    this.pool = new FastArray<T>();
  }


  public Release(item:T){
    this.pool.push(item);
  }

  public GetNew():T{
    let res:T
    if (!(res = this.pool.pop())){
      return this.getNewItem(this.namePrefix+(this.count++), this.game, this, this.options);
    }
    return res
  }


  public BulkPopulate(count:number){
    var preloadOpts = { preload:true, ...this.options} 
    for (let i = 0; i < count; i++){
      const item = this.getNewItem(this.namePrefix+(this.count++), this.game, this, preloadOpts)
      this.Release(item)
    }
  }

}