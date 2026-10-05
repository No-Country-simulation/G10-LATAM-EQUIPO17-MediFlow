function MetricCard({ metrica }) {
  return (
    <article className="metric-card">
      <span className="metric-card__label">{metrica.etiqueta}</span>
      <strong className="metric-card__value">{metrica.valor}</strong>
      {metrica.tendencia && <span className="metric-card__trend">{metrica.tendencia}</span>}
    </article>
  )
}

export default MetricCard