import { PROCESSING_STEPS } from '../mocks/documentProcessingMock.js'

function ProcessingPipeline({ currentStep, isComplete }) {
  return (
    <section className="processing-pipeline" aria-labelledby="pipeline-title">
      <div className="pipeline-heading">
        <div>
          <span className="section-kicker"><span aria-hidden="true">●</span>Flujo MediFlow</span>
          <h2 id="pipeline-title">El agente está organizando la información</h2>
        </div>
        <span className="pipeline-pulse" aria-label={isComplete ? 'Procesamiento completado' : 'Procesamiento en curso'} />
      </div>
      <div className="pipeline-track" aria-live="polite">
        <span className="pipeline-track__line" aria-hidden="true"><span style={{ height: `${Math.min((currentStep / PROCESSING_STEPS.length) * 100, 100)}%` }} /></span>
        {PROCESSING_STEPS.map((step, index) => {
          const isDone = index < currentStep || isComplete
          const isActive = !isDone && index === currentStep
          return (
            <div className={`pipeline-step ${isDone ? 'is-done' : ''} ${isActive ? 'is-active' : ''}`} key={step.id}>
              <span className="pipeline-step__marker" aria-hidden="true">{isDone ? '✓' : index + 1}</span>
              <span className="pipeline-step__copy">
                <strong>{step.label}</strong>
                <small>{isActive ? step.detail : isDone ? 'Completado' : 'Pendiente'}</small>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ProcessingPipeline
