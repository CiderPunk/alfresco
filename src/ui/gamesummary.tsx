export type GameSummaryProps = {
  start:()=>void,
  score:number,
  time:number
}


export const GameSummary = ({start, score, time}:GameSummaryProps)=>(<div class="modal is-active">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Game Over</p>
    </header>
    <section class="modal-card-body">
      <p>You lasted for <strong>{time.toFixed(2)} seconds</strong> and scored <strong>{score} points</strong></p>
    </section>
    <footer class="modal-card-foot">
      <button class="button is-fullwidth" onClick={start}>Start Again</button>
    </footer>
  </div>
</div>)
