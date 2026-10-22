import AgentFileIcon from './AgentFileIcon'
import { formatearBytes } from '../utils/agentFiles'

const ESTADOS = {
  valid: { texto: 'Pendiente', tono: 'neutral' },
  processing: { texto: 'Procesando', tono: 'busy' },
  completed: { texto: 'Completado', tono: 'ok' },
  error: { texto: 'Error', tono: 'danger' },
}

function ScanVisual({ activo }) {
  return (
    <div className="agent-scan" aria-hidden="true">
      <span className="agent-scan__orbit agent-scan__orbit--one" />
      <span className="agent-scan__orbit agent-scan__orbit--two" />
      <span className="agent-scan__particle agent-scan__particle--one" />
      <span className="agent-scan__particle agent-scan__particle--two" />
      <span className="agent-scan__particle agent-scan__particle--three" />

      <div className="agent-scan__document">
        <span className="agent-scan__sheet">
          <span className="agent-scan__sheet-head" />
          <span className="agent-scan__sheet-row" />
          <span className="agent-scan__sheet-row agent-scan__sheet-row--short" />
          <span className="agent-scan__sheet-row" />
          <span className="agent-scan__sheet-row agent-scan__sheet-row--medium" />
          <span className="agent-scan__beam" />
        </span>
        <span className="agent-scan__badge">IA</span>
      </div>

      <div className="agent-scan__core">
        <span className="agent-scan__core-ring" />
        <span className="agent-scan__core-ring agent-scan__core-ring--delay" />
        <span className="agent-scan__core-dot" />
      </div>

      <span className="agent-scan__file-name">{activo?.archivo?.name || 'Procesando documento'}</span>
    </div>
  )
}

function CompleteVisual({ todoFallido, conIncidencias }) {
  return (
    <div className={`agent-complete-visual${todoFallido ? ' is-error' : ''}`} aria-hidden="true">
      <span className="agent-complete-visual__ring" />
      <span className="agent-complete-visual__icon">
        {todoFallido ? (
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M16 7v11M16 23.5v.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 32 32" fill="none">
            <path d="m8 16.5 5.2 5.2L24 11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="agent-complete-visual__label">
        {todoFallido ? 'Sin resultados' : conIncidencias ? 'Lote con incidencias' : 'Análisis completado'}
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
          {finalizado ? (
            <CompleteVisual todoFallido={todoFallido} conIncidencias={conIncidencias} />
          ) : (
            <ScanVisual activo={activo} />
          )}
          <div className="agent-analysis__visual-copy">
            <span>{finalizado ? 'Estado del lote' : 'Documento activo'}</span>
            <strong>{activo?.archivo?.name || (finalizado ? 'Lote finalizado' : 'Preparando archivo')}</strong>
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

          {finalizado && (
            <div className="agent-analysis__actions">
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
                className="agent-button agent-button--primary"
                onClick={onNuevaSeleccion}
              >
                Analizar otros documentos
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default AnalysisProgressPanel
