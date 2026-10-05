import { Link } from 'react-router-dom'

function QuickLinks({ accesos }) {
  return (
    <section className="quick-links" aria-label="Accesos rápidos">
      <h2 className="quick-links__title">Accesos rápidos</h2>
      <div className="quick-links__grid">
        {accesos.map((acceso) => (
          <Link key={acceso.path} to={acceso.path} className="quick-links__card">
            <strong>{acceso.etiqueta}</strong>
            <span>{acceso.descripcion}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default QuickLinks