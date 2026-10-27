import { useState, useMemo } from 'react'
import './AuthForms.css'

const REGLAS_CONTRASENA = [
  { id: 'longitud', test: (v) => v.length >= 8, texto: 'Al menos 8 caracteres' },
  { id: 'mayuscula', test: (v) => /[A-Z]/.test(v), texto: 'Una letra mayúscula' },
  { id: 'minuscula', test: (v) => /[a-z]/.test(v), texto: 'Una letra minúscula' },
  { id: 'digito', test: (v) => /\d/.test(v), texto: 'Un número' },
  { id: 'especial', test: (v) => /[^A-Za-z0-9]/.test(v), texto: 'Un carácter especial' },
]

function RegisterForm({ onSubmit, isSubmitting = false }) {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errorConfirmacion, setErrorConfirmacion] = useState('')
  const [mostrarReglas, setMostrarReglas] = useState(false)

  const validacion = useMemo(
    () => REGLAS_CONTRASENA.map((regla) => ({ ...regla, cumplida: regla.test(contrasena) })),
    [contrasena],
  )
  const contrasenaValida = validacion.every((r) => r.cumplida)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!nombre || !correo || !contrasena || !confirmacion) return

    if (!contrasenaValida) return

    if (contrasena !== confirmacion) {
      setErrorConfirmacion('Las contraseñas no coinciden')
      return
    }

    setErrorConfirmacion('')
    onSubmit?.({ nombre, correo, contrasena })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-form__field">
        <span className="auth-form__label">Nombre completo</span>
        <input
          className="auth-form__input"
          type="text"
          name="nombre"
          placeholder="Nombre y apellido"
          autoComplete="name"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          required
        />
      </label>

      <label className="auth-form__field">
        <span className="auth-form__label">Correo electrónico</span>
        <input
          className="auth-form__input"
          type="email"
          name="correo"
          placeholder="correo@hospital.cl"
          autoComplete="email"
          value={correo}
          onChange={(event) => setCorreo(event.target.value)}
          required
        />
      </label>

      <label className="auth-form__field">
        <span className="auth-form__label">Contraseña</span>
        <input
          className="auth-form__input"
          type="password"
          name="contrasena"
          placeholder="Crea una contraseña segura"
          autoComplete="new-password"
          value={contrasena}
          onChange={(event) => {
            setContrasena(event.target.value)
            if (!mostrarReglas) setMostrarReglas(true)
          }}
          minLength={8}
          required
        />
        {mostrarReglas && (
          <ul className="auth-form__rules" aria-label="Requisitos de contraseña">
            {validacion.map((regla) => (
              <li
                key={regla.id}
                className={regla.cumplida ? 'auth-form__rule is-met' : 'auth-form__rule'}
              >
                <span className="auth-form__rule-icon" aria-hidden="true">
                  {regla.cumplida ? '✓' : '○'}
                </span>
                {regla.texto}
              </li>
            ))}
          </ul>
        )}
      </label>

      <label className="auth-form__field">
        <span className="auth-form__label">Confirmar contraseña</span>
        <input
          className="auth-form__input"
          type="password"
          name="confirmacion"
          placeholder="Repite tu contraseña"
          autoComplete="new-password"
          value={confirmacion}
          onChange={(event) => {
            setConfirmacion(event.target.value)
            setErrorConfirmacion('')
          }}
          minLength={8}
          required
        />
        {errorConfirmacion && (
          <span className="auth-form__error" role="alert">
            {errorConfirmacion}
          </span>
        )}
      </label>

      <button
        type="submit"
        className="auth-form__submit"
        disabled={isSubmitting || (!contrasenaValida && contrasena.length > 0)}
      >
        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}

export default RegisterForm
