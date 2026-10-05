import { ESTADO_TEXTO } from '../types/estados'

function DocumentStateBadge({ estado }) {
  return <span className={`doc-badge doc-badge--${estado}`}>{ESTADO_TEXTO[estado] || estado}</span>
}

export default DocumentStateBadge