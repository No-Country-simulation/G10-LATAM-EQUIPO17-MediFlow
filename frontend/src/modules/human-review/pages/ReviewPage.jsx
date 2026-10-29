import { useEffect, useState } from 'react'
import { getRol, ROLES } from '../../../app/session'
import { obtenerDocumento } from '../../documents/services/documentsService'
import { asignarCaso, guardarComentario, listarAsignados, listarCasosAdmin, listarMedicos } from '../services/reviewService'
import './review.css'

const LIMITE = 50

function esCasoDeAuditoria(registro) {
  return registro.ruta_triaje?.startsWith('baja_confianza/') === true
}

function archivoDe(registro) {
  return registro.ruta_documento && registro.ruta_documento !== 'No disponible'
    ? registro.ruta_documento.split('/').at(-1)
    : registro.ruta_triaje?.split('/').at(-1) || 'Documento sin nombre'
}

function fechaDe(valor) {
  const fecha = new Date(valor)
  return valor && !Number.isNaN(fecha.getTime())
    ? new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(fecha)
    : 'Fecha no disponible'
}

function confianzaDe(valor) {
  if (valor === null || valor === undefined || valor === '') return 'No disponible'
  const numero = Number(valor)
  return Number.isFinite(numero) ? `${Math.round(numero * 100)}%` : 'No disponible'
}

function mensajeError(error) {
  switch (error?.status) {
    case 0: return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    case 401: return 'Tu sesión expiró. Inicia sesión de nuevo.'
    case 403: return 'No tienes permisos para realizar esta acción.'
    case 404: return 'Este registro o documento ya no está disponible. Actualiza la bandeja.'
    case 429: return 'Se alcanzó el límite de consultas. Espera un momento para reintentar.'
    default: return 'No se pudo completar la operación. Inténtalo de nuevo.'
  }
}

function ReviewPage() {
  const esAdmin = getRol() === ROLES.ADMIN
  const [pagina, setPagina] = useState(1)
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [actualizacion, setActualizacion] = useState(0)
  const [registros, setRegistros] = useState([])
  const [total, setTotal] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [medicos, setMedicos] = useState([])
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const [errorMedicos, setErrorMedicos] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)
  const [metadata, setMetadata] = useState(null)
  const [cargandoMetadata, setCargandoMetadata] = useState(false)
  const [errorMetadata, setErrorMetadata] = useState('')
  const [medicoId, setMedicoId] = useState('')
  const [comentario, setComentario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const idSeleccionado = seleccionado?.id
  const bucketSeleccionado = seleccionado?.bucket
  const rutaSeleccionada = seleccionado?.ruta_triaje

  useEffect(() => {
    let activo = true
    const solicitud = esAdmin
      ? listarCasosAdmin({ offset: (pagina - 1) * LIMITE, force: actualizacion > 0 })
      : listarAsignados({ offset: (pagina - 1) * LIMITE, soloPendientes, force: actualizacion > 0 })

    solicitud.then((datos) => {
      if (!activo) return
      setRegistros(Array.isArray(datos?.items) ? datos.items : [])
      setTotal(datos?.total ?? 0)
      setError('')
    }).catch((err) => {
      if (!activo) return
      setError(mensajeError(err))
      setRegistros([])
      setTotal(0)
    }).finally(() => { if (activo) setCargando(false) })
    return () => { activo = false }
  }, [esAdmin, pagina, soloPendientes, actualizacion])

  useEffect(() => {
    if (!esAdmin) return undefined
    let activo = true
    listarMedicos().then((datos) => {
      if (!activo) return
      setMedicos((datos?.items || []).filter((usuario) => usuario.rol === ROLES.MEDICO && usuario.activo !== false))
      setTotalUsuarios(datos?.total ?? 0)
      setErrorMedicos('')
    }).catch((err) => { if (activo) setErrorMedicos(mensajeError(err)) })
    return () => { activo = false }
  }, [esAdmin])

  useEffect(() => {
    if (!idSeleccionado) return undefined
    let activo = true
    Promise.resolve().then(() => {
      if (!activo) return
      setCargandoMetadata(true)
      setMetadata(null)
      setErrorMetadata('')
      if (!bucketSeleccionado || !rutaSeleccionada) {
        setErrorMetadata('Este caso no tiene metadata consultable.')
        setCargandoMetadata(false)
        return
      }
      obtenerDocumento(bucketSeleccionado, rutaSeleccionada)
        .then((datos) => { if (activo) setMetadata(datos?.metadata || {}) })
        .catch((err) => { if (activo) setErrorMetadata(mensajeError(err)) })
        .finally(() => { if (activo) setCargandoMetadata(false) })
    })
    return () => { activo = false }
  }, [idSeleccionado, bucketSeleccionado, rutaSeleccionada])

  const seleccionar = (registro) => {
    setSeleccionado(registro)
    setMedicoId(registro.id_medico_asignado || '')
    setComentario('')
    setMensaje('')
    setMetadata(null)
    setErrorMetadata('')
  }

  const actualizar = () => {
    setCargando(true)
    setSeleccionado(null)
    setMensaje('')
    setActualizacion((valor) => valor + 1)
  }

  const asignar = async (event) => {
    event.preventDefault()
    if (!seleccionado || !medicoId || guardando) return
    setGuardando(true)
    setMensaje('')
    try {
      const actualizado = await asignarCaso(seleccionado.id, medicoId)
      setSeleccionado(actualizado)
      setRegistros((previos) => previos.map((registro) => registro.id === actualizado.id ? actualizado : registro))
      setMensaje('Documento asignado correctamente.')
    } catch (err) {
      setMensaje(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const comentar = async (event) => {
    event.preventDefault()
    const texto = comentario.trim()
    if (!seleccionado || !texto || guardando) return
    setGuardando(true)
    setMensaje('')
    try {
      const actualizado = await guardarComentario(seleccionado.id, texto)
      setSeleccionado(actualizado)
      setRegistros((previos) => soloPendientes
        ? previos.filter((registro) => registro.id !== actualizado.id)
        : previos.map((registro) => registro.id === actualizado.id ? actualizado : registro))
      if (soloPendientes) {
        setTotal((previo) => Math.max(0, previo - 1))
        if (registros.length === 1 && pagina > 1) {
          setSeleccionado(null)
          setCargando(true)
          setPagina((previa) => previa - 1)
        }
      }
      setComentario('')
      setMensaje('Indicación guardada correctamente.')
    } catch (err) {
      setMensaje(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const casos = esAdmin ? registros.filter(esCasoDeAuditoria) : registros

  return (
    <div className="review-page">
      <header className="review-page__intro">
        <span className="review-page__eyebrow">Triaje clínico · revisión humana</span>
        <h1>{esAdmin ? 'Asignación de revisiones' : 'Mis revisiones'}</h1>
        <p>{esAdmin
          ? 'Asigna a un médico los triajes derivados a auditoría por baja confianza.'
          : 'Consulta tus casos asignados y registra una indicación para cada revisión.'}</p>
      </header>

      <div className="review-page__toolbar">
        {!esAdmin && (
          <label className="review-page__filter">
            <input type="checkbox" checked={soloPendientes} onChange={(event) => {
              setCargando(true)
              setPagina(1)
              setSeleccionado(null)
              setSoloPendientes(event.target.checked)
            }} />
            Solo pendientes de comentario
          </label>
        )}
        <button type="button" onClick={actualizar} disabled={cargando || guardando}>Actualizar</button>
      </div>
      {mensaje && <p className="review-detail__message" role="status">{mensaje}</p>}

      {cargando && <p className="review-page__feedback" role="status">Cargando casos…</p>}
      {!cargando && error && <p className="review-page__feedback is-error" role="alert">{error}</p>}
      {!cargando && !error && (
        <>
          <p className="review-page__count" role="status">
            {esAdmin
              ? `${casos.length} caso${casos.length === 1 ? '' : 's'} de auditoría en esta página (${total} triajes en total)`
              : `${total} caso${total === 1 ? '' : 's'} ${soloPendientes ? 'pendiente' : 'asignado'}${total === 1 ? '' : 's'}`}
          </p>
          {casos.length === 0 ? (
            <p className="review-page__feedback">{esAdmin
              ? 'No hay casos de baja confianza en esta página. Revisa las demás páginas si existen.'
              : total > 0 ? 'No hay casos en esta página. Actualiza la bandeja para ver los cambios.' : 'No tienes casos asignados en esta bandeja.'}</p>
          ) : (
            <div className={seleccionado ? 'review-page__layout is-open' : 'review-page__layout'}>
              <ul className="review-page__list" aria-label={esAdmin ? 'Casos de auditoría' : 'Casos asignados'}>
                {casos.map((registro) => (
                  <li key={registro.id} className={seleccionado?.id === registro.id ? 'review-case is-selected' : 'review-case'}>
                    <div className="review-case__top">
                      <strong>{archivoDe(registro)}</strong>
                      <span className={registro.comentario_medico ? 'review-case__badge is-complete' : 'review-case__badge'}>
                        {registro.comentario_medico ? 'Comentado' : registro.id_medico_asignado ? 'Asignado · pendiente' : 'Sin asignar'}
                      </span>
                    </div>
                    <p>Procesado: {fechaDe(registro.created_at)}</p>
                    <button type="button" aria-pressed={seleccionado?.id === registro.id} onClick={() => seleccionar(registro)}>
                      Ver caso
                    </button>
                  </li>
                ))}
              </ul>

              {seleccionado && (
                <section className="review-detail" aria-labelledby="review-detail-title">
                  <div className="review-detail__head">
                    <div>
                      <span className="review-page__eyebrow">Caso seleccionado</span>
                      <h2 id="review-detail-title">{archivoDe(seleccionado)}</h2>
                    </div>
                    <button type="button" onClick={() => setSeleccionado(null)} aria-label="Cerrar detalle">Cerrar</button>
                  </div>
                  <p className="review-detail__id">Registro {seleccionado.id}</p>
                  {cargandoMetadata && <p role="status">Consultando metadata…</p>}
                  {errorMetadata && <p className="review-page__error" role="alert">{errorMetadata}</p>}
                  {metadata && (
                    <dl className="review-detail__metadata">
                      <div><dt>Tipo de documento</dt><dd>{metadata.tipo_documento || 'No disponible'}</dd></div>
                      <div><dt>Prioridad</dt><dd>{metadata.nivel_prioridad || 'No disponible'}</dd></div>
                      <div><dt>Confianza</dt><dd>{confianzaDe(metadata.score_confianza)}</dd></div>
                      <div><dt>Destino</dt><dd>{metadata.destino_enrutamiento || 'No disponible'}</dd></div>
                      <div><dt>Diagnóstico principal</dt><dd>{metadata.diagnostico_principal || 'No disponible'}</dd></div>
                    </dl>
                  )}
                  <p className="review-detail__note">Se muestra metadata de OCI, no el contenido clínico completo ni el archivo original.</p>

                  {esAdmin ? (
                    <form className="review-detail__form" onSubmit={asignar}>
                      <label htmlFor="review-doctor">Médico responsable</label>
                      <select id="review-doctor" value={medicoId} onChange={(event) => setMedicoId(event.target.value)} disabled={guardando || Boolean(seleccionado.comentario_medico)} required>
                        <option value="">Seleccionar médico</option>
                        {medicos.map((medico) => <option key={medico.id} value={medico.id}>{medico.nombre} ({medico.email})</option>)}
                      </select>
                      {errorMedicos && <p className="review-page__error" role="alert">No se pudo consultar la lista de médicos. {errorMedicos}</p>}
                      {totalUsuarios > 200 && <p className="review-detail__note">La lista de médicos se limita a los primeros 200 usuarios. Consulta al equipo para asignar a alguien que no aparezca.</p>}
                      {seleccionado.comentario_medico && <p className="review-detail__note">Este caso ya fue comentado; no se puede reasignar desde esta vista.</p>}
                      <button type="submit" disabled={!medicoId || guardando || Boolean(seleccionado.comentario_medico)}>
                        {guardando ? 'Guardando…' : seleccionado.id_medico_asignado ? 'Cambiar asignación' : 'Asignar médico'}
                      </button>
                    </form>
                  ) : seleccionado.comentario_medico ? (
                    <div className="review-detail__comment">
                      <h3>Indicación registrada</h3>
                      <p>{seleccionado.comentario_medico}</p>
                      <small>{fechaDe(seleccionado.fecha_comentario)}</small>
                    </div>
                  ) : (
                    <form className="review-detail__form" onSubmit={comentar}>
                      <label htmlFor="review-comment">Indicación médica</label>
                      <textarea id="review-comment" value={comentario} onChange={(event) => setComentario(event.target.value)} maxLength={5000} rows={5} required placeholder="Escribe tu indicación para este caso" disabled={guardando} />
                      <small>{comentario.length}/5000 caracteres</small>
                      <button type="submit" disabled={!comentario.trim() || guardando}>{guardando ? 'Guardando…' : 'Guardar indicación'}</button>
                    </form>
                  )}
                  {esAdmin && seleccionado.comentario_medico && (
                    <div className="review-detail__comment"><h3>Indicación registrada</h3><p>{seleccionado.comentario_medico}</p><small>{fechaDe(seleccionado.fecha_comentario)}</small></div>
                  )}
                </section>
              )}
            </div>
          )}
          {total > LIMITE && (
            <nav className="review-page__pagination" aria-label="Páginas de casos">
              <button type="button" disabled={pagina === 1} onClick={() => { setCargando(true); setSeleccionado(null); setPagina((valor) => valor - 1) }}>Anterior</button>
              <span>Página {pagina} de {Math.ceil(total / LIMITE)}</span>
              <button type="button" disabled={pagina * LIMITE >= total} onClick={() => { setCargando(true); setSeleccionado(null); setPagina((valor) => valor + 1) }}>Siguiente</button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}

export default ReviewPage
