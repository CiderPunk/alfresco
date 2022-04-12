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
  all = 0xffff,
  none = 0x0000,
  walkers = 0x0010,
  flyers = 0x0020,
  enemy = CollisionGroup.walkers | CollisionGroup.flyers,
}
