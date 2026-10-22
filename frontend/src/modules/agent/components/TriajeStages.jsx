const ETAPAS = [
  {
    numero: '01',
    titulo: 'Recepción',
    detalle: 'Archivo recibido y validado.',
  },
  {
    numero: '02',
    titulo: 'Clasificación',
    detalle: 'Identificación del tipo de documento.',
  },
  {
    numero: '03',
    titulo: 'Extracción',
    detalle: 'Entidades e información clínica.',
  },
  {
    numero: '04',
    titulo: 'Validación',
    detalle: 'Consistencia y enrutamiento del resultado.',
  },
  {
    numero: '05',
    titulo: 'Resultado',
    detalle: 'Persistencia y disponibilidad del resultado.',
  },
]

const ESTADOS = {
  idle: { texto: 'En espera', tono: 'neutral', nota: 'Las etapas se ejecutan de forma automática al confirmar el análisis.' },
  processing: { texto: 'En curso', tono: 'busy', nota: 'El servicio no reporta el avance por etapa durante el procesamiento.' },
  complete: { texto: 'Completado', tono: 'ok', nota: 'El pipeline completó el procesamiento del lote.' },
  error: { texto: 'Con incidencias', tono: 'warning', nota: 'El pipeline no pudo confirmarse para todos los documentos del lote.' },
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="m2.8 7.2 2.6 2.6 5.8-5.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TriajeStages({ estado = 'idle' }) {
  const meta = ESTADOS[estado] || ESTADOS.idle
  const completado = estado === 'complete'

  const estadoEtapa = completado
    ? 'Completado'
    : estado === 'processing'
      ? 'Sin detalle'
      : estado === 'error'
        ? 'No confirmado'
        : 'Pendiente'

  return (
    <section className="agent-card agent-pipeline" aria-labelledby="agent-pipeline-title">
      <div className="agent-card__heading agent-pipeline__heading">
        <div>
          <span className="agent-eyebrow">Pipeline clínico</span>
          <h2 id="agent-pipeline-title">Flujo de procesamiento</h2>
          <p>Etapas automáticas de análisis, extracción y estructuración clínica.</p>
        </div>
        <span className={`agent-pipeline__status agent-pipeline__status--${meta.tono}`} aria-live="polite">
          <span className="agent-pipeline__status-dot" aria-hidden="true" />
          {meta.texto}
        </span>
      </div>

      <ol className="agent-pipeline__list">
        {ETAPAS.map((etapa) => (
          <li key={etapa.numero} className={`agent-stage${completado ? ' is-complete' : ''}`}>
            <div className="agent-stage__top">
              <span className="agent-stage__numero">{etapa.numero}</span>
              {completado && (
                <span className="agent-stage__check" aria-label="Etapa completada">
                  <CheckIcon />
                </span>
              )}
            </div>
            <strong>{etapa.titulo}</strong>
            <p>{etapa.detalle}</p>
            <span className={`agent-stage__state${completado ? ' is-complete' : ''}`}>
              {estadoEtapa}
            </span>
          </li>
        ))}
      </ol>

      <p className="agent-pipeline__note">{meta.nota}</p>
    </section>
  )
}

export default TriajeStages
