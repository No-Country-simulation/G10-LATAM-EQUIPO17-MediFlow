export const ESTADO_DOCUMENTO = Object.freeze({
  RECIBIDO: 'recibido',
  PROCESADO: 'procesado',
  AUDITORIA: 'auditoria_humana',
})

export const ESTADO_OPCIONES = [
  { value: 'todos', label: 'Todos los estados' },
  { value: ESTADO_DOCUMENTO.RECIBIDO, label: 'Recibido' },
  { value: ESTADO_DOCUMENTO.PROCESADO, label: 'Procesado' },
  { value: ESTADO_DOCUMENTO.AUDITORIA, label: 'Auditoría humana' },
]

export const ESTADO_TEXTO = Object.freeze({
  recibido: 'Recibido',
  procesado: 'Procesado',
  auditoria_humana: 'Auditoría humana',
})