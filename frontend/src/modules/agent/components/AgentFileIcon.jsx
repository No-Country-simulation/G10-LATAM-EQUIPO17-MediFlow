import { etiquetaDeArchivo } from '../utils/agentFiles'

const VARIANTES = {
  PDF: 'pdf',
  PNG: 'png',
  JPG: 'jpg',
}

function AgentFileIcon({ nombre, tipo, className = '' }) {
  const etiqueta = tipo || etiquetaDeArchivo(nombre)
  const variante = VARIANTES[etiqueta] || 'file'

  return (
    <span className={`agent-file-icon agent-file-icon--${variante} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 32 38" fill="none">
        <path
          d="M7 1.5h12.1L29 11.4V33a3.5 3.5 0 0 1-3.5 3.5H7A3.5 3.5 0 0 1 3.5 33V5A3.5 3.5 0 0 1 7 1.5Z"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M19 1.8V9a2.5 2.5 0 0 0 2.5 2.5h6.4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M9.5 18h9M9.5 23h9M9.5 28h5.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.72"
        />
      </svg>
      <span className="agent-file-icon__label">{etiqueta === 'Archivo' ? 'FILE' : etiqueta}</span>
    </span>
  )
}

export default AgentFileIcon
