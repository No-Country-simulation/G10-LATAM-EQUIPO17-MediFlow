import { AgentIcon } from '../../../app/icons'

const ESTADOS = {
  desconocido: {
    etiqueta: 'Estado desconocido',
    tono: 'neutral',
    detalle: 'El servicio no expone una verificación de disponibilidad.',
  },
  operativo: {
    etiqueta: 'Operativo · En espera',
    tono: 'ok',
    detalle: 'Último análisis completado correctamente.',
  },
  procesando: {
    etiqueta: 'Procesando',
    tono: 'busy',
    detalle: 'El agente está trabajando en el lote actual.',
  },
  error: {
    etiqueta: 'Con incidencias',
    tono: 'warning',
    detalle: 'Revisa el estado del último lote procesado.',
  },
  'no-disponible': {
    etiqueta: 'No disponible',
    tono: 'danger',
    detalle: 'El servicio de análisis no respondió.',
  },
  desconectado: {
    etiqueta: 'Desconectado',
    tono: 'danger',
    detalle: 'No se pudo conectar con el servidor.',
  },
}

function AgentHeader({ estado = 'desconocido', detalle }) {
  const meta = ESTADOS[estado] || ESTADOS.desconocido

  return (
    <header className="agent-hero">
      <div className="agent-hero__copy">
        <span className="agent-hero__kicker">
          <span className="agent-hero__kicker-icon">
            <AgentIcon />
          </span>
          Inteligencia clínica autónoma
        </span>
        <h1>Agente MediFlow</h1>
        <p>Supervisa el procesamiento inteligente y análisis de documentos clínicos.</p>
      </div>

      <div className={`agent-status-card agent-status-card--${meta.tono}`} aria-live="polite">
        <span className="agent-status-card__dot" aria-hidden="true" />
        <div className="agent-status-card__copy">
          <span className="agent-status-card__label">Estado del agente</span>
          <strong>{meta.etiqueta}</strong>
          <small>{detalle || meta.detalle}</small>
        </div>
      </div>
    </header>
  )
}

export default AgentHeader
