function capitalizar(valor) {
  if (!valor) return 'N/D'
  return valor.charAt(0).toUpperCase() + valor.slice(1)
}

function InspectorEmpty() {
  return (
    <div className="agent-inspector__empty">
      <span className="agent-state-box__icon" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 2.7 18 5.6v5.2c0 4.1-2.7 7.5-7 8.9-4.3-1.4-7-4.8-7-8.9V5.6L11 2.7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M11 7.5v3.7M11 14.4v.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <h3>Sin resultados en esta sesión</h3>
      <p>Los resultados del análisis aparecerán aquí cuando el agente complete el procesamiento.</p>
    </div>
  )
}

function InferenceInspector({ resultado }) {
  if (!resultado) {
    return (
      <section className="agent-card agent-inspector" id="agent-inference" aria-labelledby="agent-inspector-title">
        <div className="agent-card__heading">
          <div>
            <span className="agent-eyebrow">Salida estructurada</span>
            <h2 id="agent-inspector-title">Inspección de inferencia</h2>
            <p>Resumen del resultado clínico del agente.</p>
          </div>
        </div>
        <InspectorEmpty />
      </section>
    )
  }

  const clasificacion = resultado.clasificacion || {}
  const datos = resultado.datos_extraidos || {}
  const decision = resultado.decision_enrutamiento || {}
  const paciente = datos.paciente || {}
  const medico = datos.medico_solicitante || {}
  const medicamentos = Array.isArray(datos.medicamentos) ? datos.medicamentos : []
  const dosis = Array.isArray(datos.dosis) ? datos.dosis : []
  const confianza = Number.isFinite(clasificacion.score_confianza_clasificacion)
    ? Math.round(clasificacion.score_confianza_clasificacion * 100)
    : null
  const camposConInformacion = [
    paciente.nombre,
    paciente.edad,
    medico.nombre,
    medico.matricula,
    datos.estudio_realizado,
    datos.diagnostico_principal,
    datos.cie10_sugerido,
    ...medicamentos,
    ...dosis,
  ].filter((valor) => valor !== null && valor !== undefined && String(valor).trim() !== '').length

  const requiereRevision = Boolean(decision.requiere_auditoria_humana)
  const persistencia =
    resultado.almacenamiento_oci?.status_backup === 'exito' ? 'OCI · Exitoso' : 'N/D'

  const campos = [
    { etiqueta: 'Tipo detectado', valor: clasificacion.tipo_documento || 'N/D' },
    { etiqueta: 'Especialidad', valor: clasificacion.especialidad || 'N/D' },
    { etiqueta: 'Prioridad', valor: capitalizar(clasificacion.nivel_prioridad) },
    { etiqueta: 'Confianza', valor: confianza === null ? 'N/D' : `${confianza}%` },
    { etiqueta: 'Destino', valor: decision.destino_principal || 'N/D' },
    { etiqueta: 'Validación', valor: requiereRevision ? 'Revisión humana' : 'Automática' },
    { etiqueta: 'Campos extraídos', valor: String(camposConInformacion) },
    { etiqueta: 'Medicamentos', valor: String(medicamentos.length) },
    { etiqueta: 'Persistencia', valor: persistencia },
    { etiqueta: 'Documento', valor: resultado.documento_id || 'N/D' },
  ]

  return (
    <section className="agent-card agent-inspector" id="agent-inference" aria-labelledby="agent-inspector-title">
      <div className="agent-card__heading agent-inspector__heading">
        <div>
          <span className="agent-eyebrow">Salida estructurada</span>
          <h2 id="agent-inspector-title">Inspección de inferencia</h2>
          <p>Resumen del resultado clínico del agente.</p>
        </div>
        <span className={`agent-inspector__status${requiereRevision ? ' is-warning' : ''}`}>
          {requiereRevision ? 'Requiere revisión' : 'Procesado'}
        </span>
      </div>

      <div className="agent-inspector__grid">
        {campos.map((campo) => (
          <div key={campo.etiqueta} className="agent-inspector__field">
            <span>{campo.etiqueta}</span>
            <strong title={String(campo.valor)}>{campo.valor}</strong>
          </div>
        ))}
      </div>

      <p className="agent-inspector__note">
        Vista resumida sin datos identificables del paciente. El resultado completo permanece
        en el almacenamiento clínico.
      </p>
    </section>
  )
}

export default InferenceInspector
