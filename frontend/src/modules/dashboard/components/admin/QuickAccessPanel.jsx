import { Link } from 'react-router-dom'
import { AgentIcon, DocumentsIcon, StorageIcon, UsersIcon } from '../../../../app/icons'
import { rutasDelRol } from '../../../../app/navigation'
import { getRol } from '../../../../app/session'

const ACCESOS = [
  {
    path: '/agent',
    icono: AgentIcon,
    etiqueta: 'Abrir agente inteligente',
    descripcion: 'Centro de procesamiento y análisis clínico.',
  },
  {
    path: '/users',
    icono: UsersIcon,
    etiqueta: 'Gestionar usuarios',
    descripcion: 'Consulta y administra las cuentas registradas.',
  },
  {
    path: '/documents',
    icono: DocumentsIcon,
    etiqueta: 'Explorar documentos',
    descripcion: 'Consulta los documentos clínicos registrados.',
  },
  {
    path: '/documents',
    icono: DocumentsIcon,
    etiqueta: 'Revisar documentos pendientes',
    descripcion: 'Consulta los documentos que requieren procesamiento o revisión.',
  },
  {
    path: '/storage',
    icono: StorageIcon,
    etiqueta: 'Gestionar almacenamiento',
    descripcion: 'Consulta los archivos y recursos almacenados.',
  },
]

function QuickAccessPanel() {
  const rutasPermitidas = new Set(rutasDelRol(getRol()).map((item) => item.path))
  const accesos = ACCESOS.filter((acceso) => rutasPermitidas.has(acceso.path))

  return (
    <section className="admin-quick" aria-labelledby="quick-title">
      <header className="admin-section-heading admin-section-heading--compact">
        <div>
          <span className="admin-section-heading__eyebrow">Navegación</span>
          <h2 id="quick-title">Accesos rápidos</h2>
          <p>Continúa donde lo necesites.</p>
        </div>
      </header>

      <div className="admin-quick__list">
        {accesos.map((acceso) => {
          const Icono = acceso.icono
          return (
            <Link key={acceso.etiqueta} className="admin-quick__item" to={acceso.path}>
              <span className="admin-quick__icon" aria-hidden="true">
                <Icono />
              </span>
              <span className="admin-quick__copy">
                <strong>{acceso.etiqueta}</strong>
                <small>{acceso.descripcion}</small>
              </span>
              <span className="admin-quick__arrow" aria-hidden="true">→</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default QuickAccessPanel
