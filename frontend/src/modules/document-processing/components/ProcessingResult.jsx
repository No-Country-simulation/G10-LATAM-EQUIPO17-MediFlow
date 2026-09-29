function ProcessingResult({ result }) {
  const confidence = Math.round(result.clasificacion.score_confianza_clasificacion * 100)

  return (
    <section className="processing-result" aria-labelledby="result-title">
      <div className="result-heading">
        <div>
          <span className="section-kicker"><span aria-hidden="true">●</span>Resultado simulado</span>
          <h2 id="result-title">Documento procesado</h2>
        </div>
        <span className="result-status">Procesado</span>
      </div>
      <div className="result-summary">
        <div><span>Tipo de documento</span><strong>{result.clasificacion.tipo_documento}</strong></div>
        <div><span>Prioridad</span><strong className="result-value--teal">{result.clasificacion.nivel_prioridad}</strong></div>
        <div><span>Confianza</span><strong>{confidence}%</strong></div>
      </div>
      <div className="result-detail-grid">
        <div><span>Paciente</span><strong>{result.datos_extraidos.paciente.nombre}</strong></div>
        <div><span>Estudio</span><strong>{result.datos_extraidos.estudio_realizado}</strong></div>
        <div><span>Destino</span><strong>{result.decision_enrutamiento.destino_principal}</strong></div>
        <div><span>Documento ID</span><strong>{result.documento_id}</strong></div>
      </div>
      <p className="mock-note">Este resultado es un mock visual. La integración con el endpoint de triaje se realizará en una siguiente iteración.</p>
    </section>
  )
}

export default ProcessingResult
