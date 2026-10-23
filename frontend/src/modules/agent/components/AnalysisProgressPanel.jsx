import AgentFileIcon from './AgentFileIcon'
import AgentProcessingAnimation from './AgentProcessingAnimation'
import agenteFinal from '../../../shared/assets/Agente_Procesamiento-Final.jpeg'
import { formatearBytes } from '../utils/agentFiles'

const ESTADOS = {
  valid: { texto: 'Pendiente', tono: 'neutral' },
  processing: { texto: 'Procesando', tono: 'busy' },
  completed: { texto: 'Completado', tono: 'ok' },
  error: { texto: 'Error', tono: 'danger' },
}

function CompleteVisual({ todoFallido, conIncidencias }) {
  if (todoFallido) {
    return (
      <div className="agent-complete-visual is-error" aria-hidden="true">
        <span className="agent-complete-visual__icon">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 7v11M16 23.5v.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="agent-complete-visual__label">Sin resultados</span>
      </div>
    )
  }

  return (
    <div className={`agent-complete-visual${conIncidencias ? ' is-warning' : ''}`} aria-hidden="true">
      <img
        className="agent-complete-visual__image"
        src={agenteFinal}
        alt=""
        draggable="false"
        decoding="async"
      />
      <span className="agent-complete-visual__label">
        {conIncidencias ? 'Lote con incidencias' : 'Análisis completado'}
      </span>
    </div>
  )
}

function AnalysisProgressPanel({
  archivos,
  archivoActivoId,
  fase,
  resumen,
  onNuevaSeleccion,
  onReintentarFallidos,
  onVerResultado,
}) {
  const finalizado = fase === 'complete'
  const total = resumen?.total || archivos.length
  const completados = resumen?.completados ?? archivos.filter((item) => item.estado === 'completed').length
  const errores = resumen?.errores ?? archivos.filter((item) => item.estado === 'error').length
  const procesados = completados + errores
  const porcentaje = total ? Math.min(100, Math.round((procesados / total) * 100)) : 0
  const activo =
    archivos.find((item) => item.id === archivoActivoId) ||
    archivos.find((item) => item.estado === 'processing')
  const todoFallido = finalizado && completados === 0 && errores > 0
  const conIncidencias = finalizado && errores > 0
  const archivoFinal = finalizado
    ? [...archivos]
        .reverse()
        .find((item) => item.estado === 'completed' || item.estado === 'error') || null
    : null
  const archivoMostrado = activo || archivoFinal
  const resultadoFinal = finalizado
    ? [...archivos]
        .reverse()
        .find((item) => item.estado === 'completed' && item.resultado)?.resultado || null
    : null

  const titulo = !finalizado
    ? 'Analizando documento clínico'
    : todoFallido
      ? 'No se pudo completar el análisis'
      : conIncidencias
        ? 'Análisis finalizado con incidencias'
        : 'Análisis finalizado'

  const descripcion = !finalizado
    ? 'El agente MediFlow está procesando la información del archivo.'
    : todoFallido
      ? 'Ningún documento del lote pudo completarse. Revisa los mensajes y vuelve a intentarlo.'
      : `${completados} de ${total} ${total === 1 ? 'documento analizado' : 'documentos analizados'} correctamente.`

  return (
    <section className="agent-card agent-analysis" aria-labelledby="agent-analysis-title">
      <div className="agent-analysis__heading">
        <div>
          <span className="agent-eyebrow">Actividad del agente</span>
          <h2 id="agent-analysis-title" tabIndex={-1} aria-live="polite">{titulo}</h2>
          <p>{descripcion}</p>
        </div>
        <span className={`agent-analysis__badge${finalizado ? ' is-complete' : ''}`}>
          <span className="agent-analysis__badge-dot" aria-hidden="true" />
          {finalizado ? 'Finalizado' : 'En curso'}
        </span>
      </div>

      <div className="agent-analysis__grid">
        <div className={`agent-analysis__visual${finalizado ? ' is-complete' : ''}`}>
          <div className="agent-analysis__media">
            {finalizado ? (
              <CompleteVisual todoFallido={todoFallido} conIncidencias={conIncidencias} />
            ) : (
              <AgentProcessingAnimation mensaje="Procesando documento clínico" />
            )}
          </div>
          <div className="agent-analysis__visual-copy">
            <span>{finalizado ? 'Estado del lote' : 'Documento activo'}</span>
            <strong>{archivoMostrado?.archivo?.name || (finalizado ? 'Lote finalizado' : 'Preparando archivo')}</strong>
            <small>{finalizado ? descripcion : 'La animación representa el procesamiento en curso.'}</small>
          </div>
        </div>

        <div className="agent-analysis__side">
          <div className="agent-analysis__progress-copy">
            <span>Progreso del lote</span>
            <strong>{procesados} de {total}</strong>
          </div>
          <div
            className="agent-progress"
            role="progressbar"
            aria-label="Documentos procesados"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={procesados}
          >
            <span className="agent-progress__fill" style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="agent-analysis__note">
            El avance refleja los documentos que han terminado, no etapas internas del modelo.
          </p>

          <ul className="agent-analysis__queue" aria-live="polite">
            {archivos.map((item) => {
              const estado = ESTADOS[item.estado] || ESTADOS.valid
              const esActivo = item.id === archivoActivoId

              return (
                <li key={item.id} className={`agent-queue-row${esActivo ? ' is-active' : ''}`}>
                  <AgentFileIcon nombre={item.archivo?.name} tipo={item.tipo} />
                  <div className="agent-queue-row__copy">
                    <strong title={item.archivo?.name}>{item.archivo?.name}</strong>
                    <small>
                      {item.tipo} · {formatearBytes(item.archivo?.size)}
                    </small>
                    {item.error && <span className="agent-queue-row__error">{item.error}</span>}
                  </div>
                  <span className={`agent-queue-row__status agent-queue-row__status--${estado.tono}`}>
                    {estado.texto}
                  </span>
                  {item.estado === 'completed' && item.resultado && (
                    <button
                      type="button"
                      className="agent-queue-row__action"
                      onClick={() => onVerResultado(item.resultado)}
                    >
                      Ver
                    </button>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="agent-analysis__actions">
            {finalizado && (
              <>
                {errores > 0 && (
                  <button
                    type="button"
                    className="agent-button agent-button--secondary"
                    onClick={onReintentarFallidos}
                  >
                    Reintentar fallidos
                  </button>
                )}
                <button
                  type="button"
                  className={`agent-button ${resultadoFinal ? 'agent-button--secondary' : 'agent-button--primary'}`}
                  onClick={onNuevaSeleccion}
                >
                  Analizar otros documentos
                </button>
                {resultadoFinal && (
                  <button
                    type="button"
                    className="agent-button agent-button--primary"
                    onClick={() => onVerResultado(resultadoFinal)}
                  >
                    Ver resultados
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AnalysisProgressPanel
