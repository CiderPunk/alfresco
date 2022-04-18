import { IGame, IPool, IPooledItem, IPoolItemOptions } from "../interfaces"
import { FastArray } from "./fastarray"


export abstract class PooledItem<T>{
  pool:IPool<T> = null
  
  CleanUp:()=>void

  Free(): void {
    this.CleanUp()
    this.pool.Release(this)
  }
}



export class Pool<T extends IPooledItem<T>> implements IPool<T>{
  protected pool:FastArray<T>
  protected count = 1
  protected readonly options:IPoolItemOptions

  constructor( protected game:IGame, protected namePrefix:string,
    protected getNewItem:(name:string, game:IGame, pool:IPool<T>, options:IPoolItemOptions)=>T, 
    protected customOptions:IPoolItemOptions = null, defaultOptions:IPoolItemOptions = null){
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
    const preloadOpts = { preload:true, ...this.options} 
    for (let i = 0; i < count; i++){
      const item = this.getNewItem(this.namePrefix+(this.count++), this.game, this, preloadOpts)
      this.Release(item)
    }
  }

}