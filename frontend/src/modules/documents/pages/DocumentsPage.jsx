import { useEffect, useState } from 'react'
import { getRol, ROLES } from '../../../app/session'
import DocumentsFilters from '../components/DocumentsFilters'
import DocumentsTable from '../components/DocumentsTable'
import DocumentDetailPanel from '../components/DocumentDetailPanel'
import { listarHistorialDocumentos, obtenerDocumento } from '../services/documentsService'
import './documents.css'

function nombreDeArchivo(registro) {
  if (!registro.ruta_documento || registro.ruta_documento === 'No disponible') {
    return 'Triaje sin archivo disponible'
  }
  return registro.ruta_documento.split('/').at(-1) || 'Archivo sin nombre'
}

function mensajeError(error, detalle = false) {
  switch (error?.status) {
    case 0: return 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'
    case 401: return 'Tu sesión expiró. Inicia sesión de nuevo.'
    case 403: return 'No tienes permiso para consultar esta información.'
    case 404: return detalle ? 'El resultado ya no está disponible en OCI.' : 'No se encontró el historial solicitado.'
    case 429: return 'Se alcanzó el límite de consultas. Espera un momento antes de reintentar.'
    default: return 'No se pudo cargar la información. Inténtalo de nuevo más tarde.'
  }
}

function DocumentsPage() {
  const [busqueda, setBusqueda] = useState('')
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizacion, setActualizacion] = useState(0)
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')

  useEffect(() => {
    let activo = true
    listarHistorialDocumentos({ force: actualizacion > 0 })
      .then((datos) => {
        if (!activo) return
        setRegistros(Array.isArray(datos) ? datos : [])
        setError('')
      })
      .catch((err) => {
        if (!activo) return
        setError(mensajeError(err))
        setRegistros([])
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => { activo = false }
  }, [actualizacion])

  useEffect(() => {
    if (!seleccionado) return undefined
    let activo = true
    Promise.resolve().then(() => {
      if (!activo) return
      setCargandoDetalle(true)
      setErrorDetalle('')
      setMetadata(null)
      if (!seleccionado.bucket || !seleccionado.ruta_triaje) {
        setErrorDetalle('Este proceso no tiene un resultado consultable en OCI.')
        setCargandoDetalle(false)
        return
      }
      obtenerDocumento(seleccionado.bucket, seleccionado.ruta_triaje)
        .then((datos) => { if (activo) setMetadata(datos?.metadata || {}) })
        .catch((err) => { if (activo) setErrorDetalle(mensajeError(err, true)) })
        .finally(() => { if (activo) setCargandoDetalle(false) })
    })
    return () => { activo = false }
  }, [seleccionado])

  const texto = busqueda.trim().toLocaleLowerCase()
  const visibles = registros.filter((registro) =>
    !texto || [nombreDeArchivo(registro), registro.id, registro.ruta_triaje]
      .some((valor) => String(valor || '').toLocaleLowerCase().includes(texto)),
  )

  const seleccionar = (registro) => {
    setMetadata(null)
    setErrorDetalle('')
    setCargandoDetalle(true)
    setSeleccionado(registro)
  }

  return (
    <div className="doc-page">
      <header className="doc-page__intro">
        <span className="doc-page__kicker">Historial de triaje</span>
        <h1>Documentos</h1>
        <p>
          {getRol() === ROLES.ADMIN
            ? 'Consulta los procesos completados del sistema. Los intentos en espera o fallidos aún no forman parte del historial.'
            : 'Consulta tus procesos completados. Los intentos en espera o fallidos aún no forman parte del historial.'}
        </p>
      </header>

      <div className="doc-page__toolbar">
        <DocumentsFilters busqueda={busqueda} onBusqueda={setBusqueda} />
        <button
          type="button"
          className="doc-page__refresh"
          disabled={cargando}
          onClick={() => {
            setCargando(true)
            setSeleccionado(null)
            setActualizacion((valor) => valor + 1)
          }}
        >
          Actualizar historial
        </button>
      </div>

      {cargando && <p className="doc-page__state" role="status">Cargando historial…</p>}
      {!cargando && error && <p className="doc-page__state is-error" role="alert">{error}</p>}
      {!cargando && !error && (
        <>
          <p className="doc-page__count" role="status">
            {`Mostrando ${visibles.length} de ${registros.length} proceso${registros.length === 1 ? '' : 's'} completado${registros.length === 1 ? '' : 's'}`}
          </p>
          {visibles.length === 0 ? (
            <p className="doc-page__state">
              {registros.length ? 'No hay procesos que coincidan con tu búsqueda.' : 'Aún no hay procesos completados para mostrar.'}
            </p>
          ) : (
            <div className={seleccionado ? 'doc-page__layout is-detail-open' : 'doc-page__layout'}>
              <div className="doc-page__list">
                <DocumentsTable
                  documentos={visibles}
                  onSeleccionar={seleccionar}
                  seleccionadoId={seleccionado?.id}
                  nombreDeArchivo={nombreDeArchivo}
                />
              </div>
              <DocumentDetailPanel
                documento={seleccionado}
                nombreDeArchivo={nombreDeArchivo}
                metadata={metadata}
                cargando={cargandoDetalle}
                error={errorDetalle}
                onClose={() => setSeleccionado(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DocumentsPage
