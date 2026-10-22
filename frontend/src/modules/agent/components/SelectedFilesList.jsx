import AgentFileIcon from './AgentFileIcon'
import { etiquetaDeArchivo, formatearBytes } from '../utils/agentFiles'

const ESTADOS = {
  valid: { texto: 'Listo', tono: 'ok' },
  invalid: { texto: 'No válido', tono: 'danger' },
  processing: { texto: 'Procesando', tono: 'busy' },
  completed: { texto: 'Completado', tono: 'ok' },
  error: { texto: 'Error', tono: 'danger' },
}

function SelectedFilesList({ archivos, onEliminar, deshabilitado = false, onVerResultado }) {
  if (!archivos.length) return null

  return (
    <ul className="agent-file-list" aria-live="polite">
      {archivos.map((item) => {
        const estado = ESTADOS[item.estado] || ESTADOS.valid
        const puedeVerResultado = item.estado === 'completed' && item.resultado && onVerResultado

        return (
          <li key={item.id} className={`agent-file-row agent-file-row--${item.estado}`}>
            <AgentFileIcon nombre={item.archivo?.name} tipo={item.tipo} />

            <div className="agent-file-row__copy">
              <strong title={item.archivo?.name}>{item.archivo?.name}</strong>
              <span className="agent-file-row__meta">
                <span>{item.tipo || etiquetaDeArchivo(item.archivo?.name)}</span>
                <span aria-hidden="true">·</span>
                <span>{formatearBytes(item.archivo?.size)}</span>
              </span>
              {item.error && <small className="agent-file-row__error">{item.error}</small>}
            </div>

            <span className={`agent-file-row__status agent-file-row__status--${estado.tono}`}>
              {estado.texto}
            </span>

            {puedeVerResultado && (
              <button
                type="button"
                className="agent-file-row__action"
                onClick={() => onVerResultado(item.resultado)}
              >
                Ver resultado
              </button>
            )}

            {onEliminar && (
              <button
                type="button"
                className="agent-file-row__remove"
                onClick={() => onEliminar(item.id)}
                disabled={deshabilitado}
                aria-label={`Eliminar ${item.archivo?.name || 'archivo'} de la selección`}
                title="Eliminar de la selección"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path d="m3.5 3.5 8 8M11.5 3.5l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default SelectedFilesList
