import { Link } from 'react-router-dom'
import { AgentIcon } from '../../../../app/icons'
import { getSession } from '../../../../app/session'

function AgentMetric({ etiqueta, valor, nota, cargando }) {
  const contenido = cargando ? '—' : valor === null || valor === undefined ? 'N/D' : valor

  return (
    <article className="admin-agent-metric" aria-busy={cargando}>
      <span className="admin-agent-metric__label">{etiqueta}</span>
      <strong className="admin-agent-metric__value">{contenido}</strong>
      <small className="admin-agent-metric__note">{nota}</small>
    </article>
  )
}

function AgentStatusCard({ metricas, cargando }) {
  const sesion = getSession()
  const nombre = sesion?.nombre || 'Administrador'

  return (
    <section className="admin-agent" aria-labelledby="agent-panel-title">
      <div className="admin-agent__content">
        <span className="admin-agent__eyebrow">
          <span className="admin-agent__icon" aria-hidden="true">
            <AgentIcon />
          </span>
          <span className="admin-agent__environment-dot" aria-hidden="true" />
          El núcleo inteligente de la plataforma
        </span>

        <h2 id="agent-panel-title">Análisis clínico inteligente</h2>
        <p className="admin-agent__description">
          Transforma documentos clínicos en información estructurada mediante procesos
          inteligentes de clasificación, extracción y revisión.
        </p>

        <div className="admin-agent__actions">
          <Link className="admin-agent__cta" to="/agent">
            Explorar agente inteligente
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <p className="admin-agent__note">
          Consulta el estado de los procesos de análisis y la actividad reciente de la plataforma.
        </p>
        <p className="admin-agent__welcome">Bienvenido, {nombre}</p>
      </div>

      <aside className="admin-agent__status" aria-label="Estado y métricas del agente">
        <header className="admin-agent__status-header">
          <span className="admin-agent__status-name">
            <span className="admin-agent__status-dot" aria-hidden="true" />
            Estado del agente
          </span>
          <strong className="admin-agent__status-value">Desconocido</strong>
        </header>

        <div className="admin-agent__metrics">
          <AgentMetric
            etiqueta="Procesados hoy"
            valor={metricas?.documentosHoy}
            nota="Registros del día actual"
            cargando={cargando}
          />
          <AgentMetric
            etiqueta="Pendientes"
            valor={null}
            nota="La cola de procesamiento no está disponible"
            cargando={cargando}
          />
          <AgentMetric
            etiqueta="En revisión"
            valor={metricas?.enRevision}
            nota={metricas?.enRevisionTruncado ? 'Auditoría humana (límite 500)' : 'Documentos en auditoría humana'}
            cargando={cargando}
          />
          <AgentMetric
            etiqueta="Tasa de éxito"
            valor={null}
            nota="Sin datos de fallos disponibles"
            cargando={cargando}
          />
        </div>

        <p className="admin-agent__hint">
          El estado del agente no está disponible en esta versión. Las cifras se calculan con
          los registros de triaje y el estado del almacenamiento.
        </p>
      </aside>
    </section>
  )
}

export default AgentStatusCard
