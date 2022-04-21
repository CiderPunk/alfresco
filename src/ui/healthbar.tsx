export type HealthBarProps = {
  health:number
}

export const HealthBar = ({health}: HealthBarProps) => {
  const style={width: Math.min(health * 100,100) + '%'}
  return (<div id="healthBar">
    <span style={style}></span>
  </div>)
}
