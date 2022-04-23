export type IntroProps = {
  start:()=>void
}


export const Intro = ({start}:IntroProps)=>(<div class="modal is-active">
  <div class="modal-background"></div>
  <div class="modal-card">
    <header class="modal-card-head">
      <p class="modal-card-title">Alfresco <span class="is-linethrough">Dining</span> Dying</p>
    </header>
    <section class="modal-card-body">
      Protect your picnic from marauding insects
    </section>
    <footer class="modal-card-foot">
      <button class="button is-fullwidth" onClick={start}>Start</button>
    </footer>
  </div>
</div>)
