import { useState } from 'react'
import './AuthForms.css'

function RegisterForm({ onSubmit, isSubmitting = false }) {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errorConfirmacion, setErrorConfirmacion] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!nombre || !correo || !contrasena || !confirmacion) return
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
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
          minLength={8}
          required
        />
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

      <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>
    </form>
  )
}

export default RegisterForm
