import './Avatar.css'

function iniciales(nombre, rol) {
  const fuente = nombre || rol || 'Usuario'
  return fuente
    .split(/\s+/)
    .map((parte) => parte.charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('')
}

function Avatar({ nombre, rol, size = 36, className }) {
  return (
    <span
      className={className ? `mf-avatar ${className}` : 'mf-avatar'}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-label={nombre || rol}
    >
      {iniciales(nombre, rol)}
    </span>
  )
}

export default Avatar