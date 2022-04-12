import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup"
import { TransformNode } from "@babylonjs/core/Meshes/transformNode"

export function cloneAnim(source:AnimationGroup, name:string, dest:TransformNode):AnimationGroup{
  return source.clone(name,
    target=>{ 
      return dest.getChildren(n=>n.name.endsWith(target.name), false)[0]}
    )
}