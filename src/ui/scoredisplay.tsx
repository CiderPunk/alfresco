
export type ScoreDisplayProps = {
  score:number,
  time:number
}


export const ScoreDisplay = ({score, time}:ScoreDisplayProps)=>{

  return (<div id="scoredisplay">
    <span id="score">{score}</span>
    <span id="time">{time.toFixed(2)}</span>
  </div>)

}