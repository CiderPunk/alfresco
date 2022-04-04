export enum EntityType {
  bullet,
  player,
  enemy,
  boundary
}



export enum CollisionGroup {
  boundary = 0x0001,
  player = 0x0002,
  projectile = 0x0004,
  enemy = 0x0008,
  all = 0xffff,
  none = 0x0000,
}
