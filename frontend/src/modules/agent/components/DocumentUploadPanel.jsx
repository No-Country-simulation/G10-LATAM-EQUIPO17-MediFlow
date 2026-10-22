import { useRef, useState } from 'react'
import AnalysisConfirmation from './AnalysisConfirmation'
import SelectedFilesList from './SelectedFilesList'

function UploadIllustration() {
  return (
    <span className="agent-dropzone__illustration" aria-hidden="true">
      <svg viewBox="0 0 84 76" fill="none">
        <rect x="18" y="10" width="42" height="52" rx="8" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="1.8" />
        <path d="M28 25h22M28 33h22M28 41h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.72" />
        <circle cx="61" cy="54" r="16" fill="var(--agent-surface)" stroke="currentColor" strokeWidth="1.8" />
        <path d="M61 47v14M54 54h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function DocumentUploadPanel({
  archivos,
  fase,
  onAgregar,
  onEliminar,
  onLimpiar,
  onContinuar,
  onVolver,
  onConfirmar,
}) {
  const inputRef = useRef(null)
  const [arrastrando, setArrastrando] = useState(false)

  const validos = archivos.filter((item) => item.estado === 'valid')
  const invalidos = archivos.filter((item) => item.estado === 'invalid')

  const abrirSelector = () => inputRef.current?.click()

  const recibirArchivos = (lista) => {
    const seleccionados = Array.from(lista || [])
    if (seleccionados.length) onAgregar(seleccionados)
  }

  const manejarSeleccion = (event) => {
    recibirArchivos(event.target.files)
    event.target.value = ''
  }

  const manejarDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setArrastrando(false)
    recibirArchivos(event.dataTransfer.files)
  }

  if (fase === 'confirm') {
    return (
      <section className="agent-card agent-upload-card" aria-label="Confirmación del análisis">
        <AnalysisConfirmation archivos={validos} onConfirmar={onConfirmar} onVolver={onVolver} />
      </section>
    )
  }

  return (
    <section className="agent-card agent-upload-card" aria-labelledby="agent-upload-title">
      <div className="agent-card__heading">
        <div>
          <span className="agent-eyebrow">Ingesta de documentos</span>
          <h2 id="agent-upload-title" tabIndex={-1}>Documentos para análisis</h2>
          <p>
            Selecciona uno o varios archivos. Podrás revisar la lista y confirmar el análisis
            cuando estés listo.
          </p>
        </div>
        {archivos.length > 0 && (
          <span className="agent-upload__counter">
            {archivos.length} {archivos.length === 1 ? 'documento' : 'documentos'}
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="agent-visually-hidden"
        onChange={manejarSeleccion}
        tabIndex={-1}
        aria-label="Seleccionar documentos clínicos"
      />

      {archivos.length === 0 ? (
        <button
          type="button"
          className={`agent-dropzone${arrastrando ? ' is-dragging' : ''}`}
          onClick={abrirSelector}
          onDragEnter={(event) => {
            event.preventDefault()
            setArrastrando(true)
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={manejarDrop}
        >
          <UploadIllustration />
          <span className="agent-dropzone__title">
            Arrastra tus documentos clínicos aquí o haz clic para explorar
          </span>
          <span className="agent-dropzone__description">
            El agente procesará, clasificará y estructurará la información disponible de los
            documentos seleccionados.
          </span>
          <span className="agent-dropzone__cta">+ Subir documentos para análisis</span>
          <span className="agent-dropzone__formats">
            <span>PDF clínico</span>
            <span>PNG</span>
            <span>JPG / JPEG</span>
            <span>Máximo 10 MB</span>
          </span>
        </button>
      ) : (
        <>
          <SelectedFilesList
            archivos={archivos}
            onEliminar={onEliminar}
            deshabilitado={fase === 'processing'}
          />

          <div className="agent-upload__summary">
            <span>
              <strong>{validos.length}</strong> {validos.length === 1 ? 'listo' : 'listos'}
              {invalidos.length > 0 && (
                <>
                  {' · '}
                  <strong className="agent-upload__summary-error">{invalidos.length}</strong>{' '}
                  {invalidos.length === 1 ? 'con error' : 'con errores'}
                </>
              )}
            </span>
            <button type="button" className="agent-link-button" onClick={onLimpiar}>
              Limpiar selección
            </button>
          </div>

          {invalidos.length > 0 && (
            <p className="agent-upload__warning" role="alert">
              Corrige o elimina los archivos marcados como no válidos para continuar.
            </p>
          )}

          <div className="agent-upload__actions">
            <button
              type="button"
              className="agent-button agent-button--secondary"
              onClick={abrirSelector}
            >
              Agregar más archivos
            </button>
            <button
              type="button"
              className="agent-button agent-button--primary"
              onClick={onContinuar}
              disabled={validos.length === 0 || invalidos.length > 0}
            >
              Continuar con el análisis
            </button>
          </div>
        </>
      )}

      <div className="agent-upload__footer">
        <p>
          La selección directa desde Storage todavía no está disponible. Puedes cargar
          archivos desde tu dispositivo.
        </p>
        <p>El análisis no se inicia hasta que confirmes la operación.</p>
      </div>
    </section>
  )
}

export default DocumentUploadPanel
