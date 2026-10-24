import AgentFileIcon from './AgentFileIcon'
import AgentProcessingAnimation from './AgentProcessingAnimation'
import agenteFinal from '../../../shared/assets/Agente_Procesamiento-Final.jpeg'
import agenteError from '../../../shared/assets/Agente_Procesamiento-Final_Error.jpeg'
import { formatearBytes } from '../utils/agentFiles'

const ESTADOS = {
  valid: { texto: 'Pendiente', tono: 'neutral' },
  processing: { texto: 'Procesando', tono: 'busy' },
  completed: { texto: 'Completado', tono: 'ok' },
  error: { texto: 'Error', tono: 'danger' },
}

function CompleteVisual({ todoFallido, conIncidencias, cancelado }) {
  if (todoFallido) {
    return (
      <div className="agent-complete-visual is-error" aria-hidden="true">
        <img
          className="agent-complete-visual__image"
          src={agenteError}
          alt=""
          draggable="false"
          decoding="async"
        />
        <span className="agent-complete-visual__label">
          {cancelado ? 'Procesamiento cancelado' : 'Procesamiento no completado'}
        </span>
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
  onDetener,
  cancelando = false,
  mensajeCancelacion = 'Se canceló la espera de la respuesta por solicitud del usuario. El servidor puede continuar el procesamiento.',
  onNuevaSeleccion,
  onReintentarFallidos,
  onVerResultado,
}) {
  const cancelado = fase === 'cancelled'
  const finalizado = fase === 'complete' || cancelado
  const total = resumen?.total || archivos.length
  const completados = resumen?.completados ?? archivos.filter((item) => item.estado === 'completed').length
  const errores = resumen?.errores ?? archivos.filter((item) => item.estado === 'error').length
  const procesados = completados + errores
  const porcentaje = total ? Math.min(100, Math.round((procesados / total) * 100)) : 0
  const activo =
    archivos.find((item) => item.id === archivoActivoId) ||
    archivos.find((item) => item.estado === 'processing')
  const todoFallido = finalizado && (cancelado || (completados === 0 && errores > 0))
  const conIncidencias = finalizado && !cancelado && errores > 0
  const archivoFinal = finalizado
    ? [...archivos]
        .reverse()
        .find((item) => item.estado === 'completed' || item.estado === 'error') || null
    : null
  const archivoMostrado = activo || archivoFinal
  const itemResultadoFinal = finalizado && !cancelado
    ? [...archivos]
        .reverse()
        .find((item) => item.estado === 'completed' && item.resultado) || null
    : null
  const resultadoFinal = itemResultadoFinal?.resultado || null
  const etiquetaLote = cancelado ? 'Lote cancelado' : 'Lote finalizado'

  const contextoResultado = (item) => ({
    archivo: item?.archivo,
    archivoTipo: item?.tipo,
    duracion: item?.duracion,
    procesadoEn: item?.procesadoEn,
    lote: { total, completados, errores },
  })

  const titulo = !finalizado
    ? 'Analizando documento clínico'
    : cancelado
      ? 'Procesamiento cancelado'
      : todoFallido
        ? 'No se pudo completar el análisis'
        : conIncidencias
          ? 'Análisis finalizado con incidencias'
          : 'Análisis finalizado'

  const descripcion = !finalizado
    ? 'El agente MediFlow está procesando la información del archivo.'
    : cancelado
      ? mensajeCancelacion
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
        <span className={`agent-analysis__badge${cancelado ? ' is-cancelled' : finalizado ? ' is-complete' : ''}`}>
          <span className="agent-analysis__badge-dot" aria-hidden="true" />
          {cancelado ? 'Cancelado' : finalizado ? 'Finalizado' : 'En curso'}
        </span>
      </div>

      <div className="agent-analysis__grid">
        <div className={`agent-analysis__visual${finalizado ? ' is-complete' : ''}${cancelado ? ' is-cancelled' : ''}`}>
          <div className="agent-analysis__media">
            {finalizado ? (
              <CompleteVisual
                todoFallido={todoFallido}
                conIncidencias={conIncidencias}
                cancelado={cancelado}
              />
            ) : (
              <AgentProcessingAnimation mensaje="Procesando documento clínico" />
            )}
          </div>
          <div className="agent-analysis__visual-copy">
            <span>{finalizado ? 'Estado del lote' : 'Documento activo'}</span>
            <strong>{archivoMostrado?.archivo?.name || (finalizado ? etiquetaLote : 'Preparando archivo')}</strong>
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
                  {!cancelado && item.estado === 'completed' && item.resultado && (
                    <button
                      type="button"
                      className="agent-queue-row__action"
                      onClick={() => onVerResultado(item.resultado, contextoResultado(item))}
                    >
                      Ver
                    </button>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="agent-analysis__actions">
            {!finalizado && (
              <button
                type="button"
                className="agent-button agent-button--danger"
                onClick={onDetener}
                disabled={cancelando}
              >
                {cancelando ? 'Deteniendo…' : 'Detener procesamiento'}
              </button>
            )}
            {finalizado && !cancelado && (
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
                    onClick={() => onVerResultado(resultadoFinal, contextoResultado(itemResultadoFinal))}
                  >
                    Ver resultados
                  </button>
                )}
              </>
            )}
            {cancelado && (
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
                  className="agent-button agent-button--primary"
                  onClick={onNuevaSeleccion}
                >
                  Analizar otros documentos
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default AnalysisProgressPanel
