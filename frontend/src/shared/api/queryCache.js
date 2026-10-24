const TTL_OPERATIVO = 60_000
const TTL_PERFIL = 5 * 60_000

export const queryTTL = Object.freeze({
  operativo: TTL_OPERATIVO,
  perfil: TTL_PERFIL,
})

export const queryKeys = Object.freeze({
  usuarios: 'auth:usuarios',
  registrosTriaje: 'triaje:registros',
  storageHealth: 'storage:health',
  storageDocumentos: ({ estado = '', prefijo = '', limite = 50 } = {}) =>
    `storage:documentos:${JSON.stringify({
      estado: estado || '',
      prefijo: prefijo || '',
      limite: limite || 50,
    })}`,
  storageMetadata: (bucket, rutaObjeto) =>
    `storage:metadata:${encodeURIComponent(String(bucket || ''))}:${encodeURIComponent(String(rutaObjeto || ''))}`,
  perfil: 'auth:me',
})

const entries = new Map()
const pending = new Map()
const versions = new Map()

let scope = 'anon'
let generation = 0

function normalizarScope(valor) {
  if (typeof valor !== 'string') return 'anon'
  const normalizado = valor.trim()
  return normalizado || 'anon'
}

function claveConScope(clave) {
  return `${scope}:${clave}`
}

function versionDe(clave) {
  return versions.get(clave) || 0
}

function incrementarVersion(clave) {
  versions.set(clave, versionDe(clave) + 1)
}

export function getQueryCacheScope() {
  return scope
}

export function clearQueryCache() {
  entries.clear()
  pending.clear()
  versions.clear()
  generation += 1
}

export function setQueryCacheScope(nuevoScope) {
  const normalizado = normalizarScope(nuevoScope)
  if (normalizado === scope) return

  clearQueryCache()
  scope = normalizado
}

export function invalidateQuery(clave) {
  const claveCompleta = claveConScope(clave)
  entries.delete(claveCompleta)
  pending.delete(claveCompleta)
  incrementarVersion(claveCompleta)
}

export function invalidateQueryPrefix(prefijo) {
  const prefijoCompleto = claveConScope(prefijo)
  const claves = new Set()

  entries.forEach((_, clave) => {
    if (clave.startsWith(prefijoCompleto)) claves.add(clave)
  })
  pending.forEach((_, clave) => {
    if (clave.startsWith(prefijoCompleto)) claves.add(clave)
  })

  claves.forEach((clave) => {
    entries.delete(clave)
    pending.delete(clave)
    incrementarVersion(clave)
  })
}

export function fetchQuery(clave, fetcher, { ttl = TTL_OPERATIVO, force = false } = {}) {
  const claveCompleta = claveConScope(clave)
  const generacionAlIniciar = generation
  const scopeAlIniciar = scope

  const solicitudEnCurso = pending.get(claveCompleta)
  if (
    solicitudEnCurso &&
    solicitudEnCurso.generation === generacionAlIniciar &&
    solicitudEnCurso.scope === scopeAlIniciar
  ) {
    return solicitudEnCurso.promise
  }

  if (solicitudEnCurso) pending.delete(claveCompleta)

  if (!force) {
    const entrada = entries.get(claveCompleta)
    if (entrada) {
      if (Date.now() - entrada.updatedAt <= entrada.ttl) {
        return Promise.resolve(entrada.data)
      }
      entries.delete(claveCompleta)
    }
  }

  const versionAlIniciar = versionDe(claveCompleta)

  let promesa
  promesa = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      const mismaSesion =
        scope === scopeAlIniciar &&
        generation === generacionAlIniciar
      const mismaVersion = versionDe(claveCompleta) === versionAlIniciar

      if (mismaSesion && mismaVersion) {
        entries.set(claveCompleta, {
          data,
          updatedAt: Date.now(),
          ttl,
        })
      }

      return data
    })
    .finally(() => {
      const actual = pending.get(claveCompleta)
      if (actual?.promise === promesa) pending.delete(claveCompleta)
    })

  pending.set(claveCompleta, {
    promise: promesa,
    generation: generacionAlIniciar,
    scope: scopeAlIniciar,
  })

  return promesa
}
