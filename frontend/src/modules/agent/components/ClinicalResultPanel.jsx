import { useEffect, useRef, useState } from 'react'
import AgentFileIcon from './AgentFileIcon'
import { descargarPdfResultadoClinico } from '../utils/clinicalResultPdf'

async function copiarAlPortapapeles(texto) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto)
      return
    } catch {
      // Algunos navegadores bloquean Clipboard API sin permiso explícito.
    }
  }

  const area = document.createElement('textarea')
  area.value = texto
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  try {
    area.select()
    const copiado = document.execCommand('copy')
    if (!copiado) throw new Error('No se pudo copiar')
  } finally {
    document.body.removeChild(area)
  }
}

function ResultField({ label, value, wide = false, children }) {
  return (
    <div className={`agent-result__field${wide ? ' agent-result__field--wide' : ''}`}>
      <span>{label}</span>
      {children || (
        <strong className={value === 'No disponible' ? 'is-muted' : ''}>{value}</strong>
      )}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.2v7.2M5.2 6.8 8 9.6l2.8-2.8M3 11.2v1.2c0 .8.6 1.4 1.4 1.4h7.2c.8 0 1.4-.6 1.4-1.4v-1.2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * @param {{
 *   vista: import('../types/triaje.js').ResultadoClinicoVista,
 *   onVolver: () => void,
 *   onAnalizarOtro: () => void,
 *   puedeAnalizarOtro?: boolean,
 * }} props
 */
function ClinicalResultPanel({ vista, onVolver, onAnalizarOtro, puedeAnalizarOtro = true }) {
  const [generandoPdf, setGenerandoPdf] = useState(false)
  const [errorPdf, setErrorPdf] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [errorCopia, setErrorCopia] = useState('')
  const copiadoTimeoutRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(copiadoTimeoutRef.current)
  }, [])

  if (!vista) return null

  const archivoMeta = [
    vista.archivoTipo && vista.archivoTipo !== 'Archivo' ? vista.archivoTipo : null,
    vista.archivoTamano,
  ]
    .filter(Boolean)
    .join(' · ')
  const etiquetaCampos = `${vista.cantidadCampos} ${
    vista.cantidadCampos === 1 ? 'campo identificado' : 'campos identificados'
  }`
  const idDisponible = vista.documentoId !== 'No disponible'
  const prioridadClase =
    vista.prioridad === 'Urgente'
      ? 'warning'
      : vista.prioridad === 'Emergencia'
        ? 'danger'
        : vista.prioridad === 'Rutina'
          ? 'ok'
          : 'neutral'

  const manejarDescarga = async () => {
    if (generandoPdf) return
    setGenerandoPdf(true)
    setErrorPdf('')
    try {
      await descargarPdfResultadoClinico(vista)
    } catch {
      setErrorPdf('No se pudo generar el PDF. Inténtalo de nuevo.')
    } finally {
      setGenerandoPdf(false)
    }
  }

  const manejarCopia = async () => {
    setErrorCopia('')
    setCopiado(false)
    try {
      await copiarAlPortapapeles(vista.documentoId)
      setCopiado(true)
      clearTimeout(copiadoTimeoutRef.current)
      copiadoTimeoutRef.current = setTimeout(() => setCopiado(false), 2200)
    } catch {
      setErrorCopia('No se pudo copiar el identificador.')
    }
  }

  return (
    <section
      className="agent-card agent-result"
      aria-labelledby="agent-result-title"
      aria-busy={generandoPdf}
    >
      <header className="agent-result__header">
        <div className="agent-result__identity">
          <span className="agent-eyebrow">Salida clínica estructurada</span>
          <div className="agent-result__title-row">
            <h2 id="agent-result-title" tabIndex={-1}>Resultado Clínico</h2>
            <span className={`agent-result__status${vista.estado !== 'Completado' ? ' is-warning' : ''}`}>
              <span className="agent-result__status-dot" aria-hidden="true" />
              {vista.estado}
            </span>
            {vista.revisionHumana && (
              <span className="agent-result__status is-warning">Revisión humana</span>
            )}
          </div>

          <div className="agent-result__file">
            <AgentFileIcon nombre={vista.archivoNombre} tipo={vista.archivoTipo} />
            <div className="agent-result__file-copy">
              <strong title={vista.archivoNombre}>{vista.archivoNombre}</strong>
              {archivoMeta && <span>{archivoMeta}</span>}
            </div>
          </div>
        </div>

        <div className="agent-result__header-actions">
          <button
            type="button"
            className="agent-button agent-button--primary"
            onClick={manejarDescarga}
            disabled={generandoPdf}
          >
            <DownloadIcon />
            {generandoPdf ? 'Generando PDF…' : 'Descargar resultados'}
          </button>
        </div>
      </header>

      {errorPdf && (
        <p className="agent-result__error" role="alert">
          {errorPdf}
        </p>
      )}

      {vista.lote && vista.lote.total > 1 && (
        <p className={`agent-result__batch${vista.lote.errores > 0 ? ' is-warning' : ''}`} role="status">
          {vista.lote.completados} de {vista.lote.total} documentos completados
          {vista.lote.errores > 0 ? ` · ${vista.lote.errores} con error` : ''}
        </p>
      )}

      <div className="agent-result__body">
        <section className="agent-result__section" aria-labelledby="agent-result-summary-title">
          <div className="agent-result__section-heading">
            <span className="agent-eyebrow">Resumen</span>
            <h3 id="agent-result-summary-title">Resumen del documento</h3>
          </div>
          {vista.resumen ? (
            <p>{vista.resumen}</p>
          ) : (
            <p className="agent-result__empty">
              El backend no proporcionó un resumen narrativo para este documento. La información
              clínica estructurada disponible se muestra a continuación.
            </p>
          )}
        </section>

        <section className="agent-result__section" aria-labelledby="agent-result-clinical-title">
          <div className="agent-result__section-heading">
            <span className="agent-eyebrow">Información clínica</span>
            <h3 id="agent-result-clinical-title">Información clínica identificada</h3>
          </div>

          <div className="agent-result__grid">
            <ResultField label="Tipo de documento" value={vista.tipoDocumento} />
            <ResultField label="Fecha del documento" value={vista.fechaDocumento} />
            <ResultField label="Especialidad" value={vista.especialidad} />
            <ResultField label="Destino" value={vista.destino} />
            <ResultField label="Prioridad">
              <span className={`agent-result__tag agent-result__tag--${prioridadClase}`}>
                {vista.prioridad}
              </span>
            </ResultField>
            <ResultField label="Campos extraídos" value={etiquetaCampos} />
            <ResultField label="Medicamentos identificados">
              {vista.medicamentos.estado === 'lista' ? (
                <ul className="agent-result__inline-list">
                  {vista.medicamentos.valores.map((medicamento, index) => (
                    <li key={`${medicamento}-${index}`}>{medicamento}</li>
                  ))}
                </ul>
              ) : (
                <strong className={vista.medicamentos.estado === 'no-disponible' ? 'is-muted' : ''}>
                  {vista.medicamentos.texto}
                </strong>
              )}
            </ResultField>
            <ResultField label="Persistencia">
              <span className={`agent-result__tag agent-result__tag--${vista.persistencia.tono}`}>
                {vista.persistencia.texto}
              </span>
            </ResultField>
            <ResultField label="ID de documento" wide>
              <div className="agent-result__id-row">
                <code>{vista.documentoId}</code>
                <button
                  type="button"
                  className="agent-result__copy"
                  onClick={manejarCopia}
                  disabled={!idDisponible}
                  aria-label="Copiar identificador del documento"
                >
                  {copiado ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <span
                className={`agent-result__copy-status${errorCopia ? ' is-error' : ''}`}
                aria-live="polite"
              >
                {errorCopia || (copiado ? 'Identificador copiado.' : '')}
              </span>
            </ResultField>
          </div>

          {vista.campos.length > 0 && (
            <div className="agent-result__fields">
              <h4>Campos extraídos</h4>
              <ul>
                {vista.campos.map((campo) => (
                  <li key={campo.etiqueta}>
                    <span>{campo.etiqueta}</span>
                    <strong>{campo.valor}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vista.campos.length === 0 && vista.medicamentos.estado !== 'lista' && (
            <p className="agent-result__empty">
              No se identificaron campos clínicos estructurados en la respuesta del agente.
            </p>
          )}
        </section>

        <section className="agent-result__section" aria-labelledby="agent-result-findings-title">
          <div className="agent-result__section-heading">
            <span className="agent-eyebrow">Observaciones</span>
            <h3 id="agent-result-findings-title">Hallazgos relevantes</h3>
          </div>

          {vista.hallazgos.principal && (
            <div className="agent-result__finding is-primary">
              <span className="agent-result__finding-icon" aria-hidden="true">!</span>
              <div>
                <strong>Hallazgo principal</strong>
                <p>{vista.hallazgos.principal}</p>
              </div>
            </div>
          )}

          {vista.hallazgos.observaciones.length > 0 && (
            <ul className="agent-result__findings">
              {vista.hallazgos.observaciones.map((observacion, index) => (
                <li key={`${observacion}-${index}`} className="agent-result__finding">
                  <span className="agent-result__finding-icon" aria-hidden="true">i</span>
                  <p>{observacion}</p>
                </li>
              ))}
            </ul>
          )}

          {!vista.hallazgos.principal && vista.hallazgos.observaciones.length === 0 && (
            <p className="agent-result__empty">
              No se identificaron observaciones relevantes en la respuesta del agente.
            </p>
          )}
        </section>

        <section className="agent-result__section" aria-labelledby="agent-result-status-title">
          <div className="agent-result__section-heading">
            <span className="agent-eyebrow">Trazabilidad</span>
            <h3 id="agent-result-status-title">Estado del procesamiento</h3>
          </div>

          <div className="agent-result__stats">
            <div className="agent-result__stat">
              <span>Estado</span>
              <strong>{vista.estado}</strong>
            </div>
            <div className="agent-result__stat">
              <span>Tiempo de procesamiento</span>
              <strong className={vista.tiempo === 'No disponible' ? 'is-muted' : ''}>{vista.tiempo}</strong>
            </div>
            <div className="agent-result__stat">
              <span>Campos extraídos</span>
              <strong>{vista.cantidadCampos}</strong>
            </div>
            <div className="agent-result__stat">
              <span>Confianza</span>
              <strong className={vista.confianza === 'No disponible' ? 'is-muted' : ''}>
                {vista.confianza}
              </strong>
            </div>
          </div>
          <p className="agent-result__stats-note">
            La confianza corresponde a la clasificación del agente, no a la precisión clínica.
          </p>
        </section>
      </div>

      <footer className="agent-result__actions">
        <button type="button" className="agent-button agent-button--primary" onClick={onVolver}>
          Volver al agente
        </button>
        <button
          type="button"
          className="agent-button agent-button--secondary"
          onClick={onAnalizarOtro}
          disabled={!puedeAnalizarOtro}
          title={puedeAnalizarOtro ? undefined : 'Espera a que finalice el lote en curso.'}
        >
          Analizar otro documento
        </button>
        <button
          type="button"
          className="agent-button agent-button--secondary"
          onClick={manejarDescarga}
          disabled={generandoPdf}
        >
          <DownloadIcon />
          {generandoPdf ? 'Generando PDF…' : 'Descargar resultados'}
        </button>
      </footer>
    </section>
  )
}

export default ClinicalResultPanel
