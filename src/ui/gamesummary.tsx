export type GameSummaryProps = {
  start:()=>void
}


export const GameSummary = ({start}:GameSummaryProps)=>(<div class="modal is-active">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">You died</p>
    </header>
    <section class="modal-card-body">
      Summary of results:
      
    </section>
    <footer class="modal-card-foot">
      <button class="button is-fullwidth" onClick={start}>Start Again</button>
    </footer>
  </div>
</div>)
