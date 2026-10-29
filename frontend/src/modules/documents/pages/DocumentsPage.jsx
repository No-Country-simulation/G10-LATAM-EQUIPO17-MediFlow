import { useEffect, useRef, useState } from 'react'
import { getRol, ROLES } from '../../../app/session'
import Modal from '../../../shared/ui/Modal'
import { eliminarRegistroTriaje } from '../../agent/services/agentService'
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
  const limite = 50
  const [pagina, setPagina] = useState(1)
  const [total, setTotal] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [actualizacion, setActualizacion] = useState(0)
  const [error, setError] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')
  const [registroAEliminar, setRegistroAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const botonEliminarRef = useRef(null)
  const tituloRef = useRef(null)

  useEffect(() => {
    let activo = true
    listarHistorialDocumentos({ offset: (pagina - 1) * limite, limit: limite, force: actualizacion > 0 })
      .then((datos) => {
        if (!activo) return
        setRegistros(Array.isArray(datos?.items) ? datos.items : [])
        setTotal(datos?.total ?? 0)
        setError('')
      })
      .catch((err) => {
        if (!activo) return
        setError(mensajeError(err))
        setRegistros([])
        setTotal(0)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => { activo = false }
  }, [actualizacion, pagina])

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

  const esAdmin = getRol() === ROLES.ADMIN

  const seleccionar = (registro) => {
    setMetadata(null)
    setErrorDetalle('')
    setCargandoDetalle(true)
    setSeleccionado(registro)
  }

  const solicitarEliminacion = (registro, boton) => {
    botonEliminarRef.current = boton
    setRegistroAEliminar(registro)
    setErrorEliminacion('')
  }

  const cerrarEliminacion = () => {
    if (eliminando) return
    setRegistroAEliminar(null)
    setErrorEliminacion('')
    requestAnimationFrame(() => botonEliminarRef.current?.focus())
  }

  const confirmarEliminacion = async () => {
    if (!registroAEliminar || eliminando) return
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await eliminarRegistroTriaje(registroAEliminar.id)
      setRegistroAEliminar(null)
      if (seleccionado?.id === registroAEliminar.id) setSeleccionado(null)
      setCargando(true)
      if (registros.length === 1 && pagina > 1) {
        setPagina((prev) => prev - 1)
      }
      setActualizacion((valor) => valor + 1)
      requestAnimationFrame(() => tituloRef.current?.focus())
    } catch (err) {
      setErrorEliminacion(mensajeError(err))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="doc-page">
      <header className="doc-page__intro">
        <span className="doc-page__kicker">Historial de triaje</span>
        <h1 ref={tituloRef} tabIndex={-1}>Documentos</h1>
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
            {`Mostrando ${visibles.length} en esta página · ${total} proceso${total === 1 ? '' : 's'} completado${total === 1 ? '' : 's'} en total`}
          </p>
          {visibles.length === 0 ? (
            <p className="doc-page__state">
              {registros.length ? 'No hay procesos que coincidan con tu búsqueda en esta página.' : total > 0 ? 'No hay procesos en esta página. Actualiza el historial para ver los cambios.' : 'Aún no hay procesos completados para mostrar.'}
            </p>
          ) : (
            <>
              <DocumentsTable
                documentos={visibles}
                onSeleccionar={seleccionar}
                seleccionadoId={seleccionado?.id}
                nombreDeArchivo={nombreDeArchivo}
                esAdmin={esAdmin}
                onEliminar={solicitarEliminacion}
              />
              <DocumentDetailPanel
                documento={seleccionado}
                nombreDeArchivo={nombreDeArchivo}
                metadata={metadata}
                cargando={cargandoDetalle}
                error={errorDetalle}
                onClose={() => setSeleccionado(null)}
              />
            </>
          )}
          {total > limite && (
            <nav className="doc-page__pagination" aria-label="Páginas del historial">
              <button type="button" disabled={pagina === 1} onClick={() => { setCargando(true); setSeleccionado(null); setPagina((prev) => prev - 1) }}>Anterior</button>
              <span>Página {pagina} de {Math.ceil(total / limite)}</span>
              <button type="button" disabled={pagina * limite >= total} onClick={() => { setCargando(true); setSeleccionado(null); setPagina((prev) => prev + 1) }}>Siguiente</button>
            </nav>
          )}
        </>
      )}
      <Modal open={Boolean(registroAEliminar)} onClose={cerrarEliminacion} title="Eliminar registro">
        {registroAEliminar && (
          <div className="doc-delete">
            <p>¿Quieres eliminar este registro del historial?</p>
            <strong className="doc-delete__name">{nombreDeArchivo(registroAEliminar)}</strong>
            <span className="doc-delete__id">Registro {registroAEliminar.id}</span>
            <p className="doc-delete__note">El registro dejará de aparecer en el historial. No podrás deshacer esta operación desde aquí.</p>
            {errorEliminacion && <p className="doc-delete__error" role="alert">{errorEliminacion}</p>}
            <div className="doc-delete__actions">
              <button type="button" onClick={cerrarEliminacion} disabled={eliminando} autoFocus>Cancelar</button>
              <button type="button" className="doc-delete__confirm" onClick={confirmarEliminacion} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar registro'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DocumentsPage
