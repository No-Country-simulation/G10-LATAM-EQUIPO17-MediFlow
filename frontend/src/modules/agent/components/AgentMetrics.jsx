import { formatearDuracion } from '../utils/agentFiles'

function MetricIcon({ tipo }) {
  if (tipo === 'hoy') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="3.5" width="16" height="17" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8 2.5v3M16 2.5v3M4 8h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="m8.5 14 2.2 2.2 4.8-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (tipo === 'cola') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 4.5 2.8 6.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    )
  }

  if (tipo === 'completados') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2.8 19.2 6v5.5c0 4.4-2.8 8.2-7.2 9.7-4.4-1.5-7.2-5.3-7.2-9.7V6L12 2.8Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="m8.6 12 2.2 2.2 4.6-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="13" r="7.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 9.5V13l2.3 1.4M9.5 2.5h5M12 2.5v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AgentMetrics({ metricas, cargandoHistorial }) {
  const valorHistorico = (valor) => {
    if (cargandoHistorial) return '—'
    return valor ?? 'N/D'
  }

  const tarjetas = [
    {
      id: 'hoy',
      etiqueta: 'Procesados hoy',
      valor: valorHistorico(metricas.procesadosHoy),
      descripcion: 'Documentos estructurados',
      nota: cargandoHistorial ? 'Consultando registros…' : 'Jornada actual',
      tono: 'sky',
    },
    {
      id: 'cola',
      etiqueta: 'En cola de análisis',
      valor: 'N/D',
      descripcion: 'Archivos pendientes de análisis',
      nota: 'Sin cola persistente en el backend',
      tono: 'amber',
    },
    {
      id: 'completados',
      etiqueta: 'Análisis completados',
      valor: valorHistorico(metricas.analisisCompletados),
      descripcion: 'Precisión clínica no evaluada',
      nota: 'Total histórico registrado',
      tono: 'teal',
    },
    {
      id: 'latencia',
      etiqueta: 'Latencia media',
      valor: metricas.latenciaMedia === null ? 'N/D' : formatearDuracion(metricas.latenciaMedia),
      descripcion: 'Tiempo medio por documento',
      nota: metricas.latenciaMedia === null ? 'Sin mediciones en esta sesión' : 'Medido en esta sesión',
      tono: 'violet',
    },
  ]

  return (
    <section className="agent-metrics" aria-label="Métricas operativas del agente" aria-busy={cargandoHistorial}>
      {tarjetas.map((tarjeta) => (
        <article key={tarjeta.id} className={`agent-metric agent-metric--${tarjeta.tono}`}>
          <span className="agent-metric__icon">
            <MetricIcon tipo={tarjeta.id} />
          </span>
          <div className="agent-metric__copy">
            <span className="agent-metric__label">{tarjeta.etiqueta}</span>
            <strong className="agent-metric__value">{tarjeta.valor}</strong>
            <span className="agent-metric__description">{tarjeta.descripcion}</span>
            <span className="agent-metric__note">{tarjeta.nota}</span>
          </div>
        </article>
      ))}
    </section>
  )
}

export default AgentMetrics
