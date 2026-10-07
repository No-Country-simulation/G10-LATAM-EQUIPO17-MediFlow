import { useState } from 'react'
import './AuthForms.css'

function LoginForm({ onSubmit, isSubmitting = false }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!correo || !contrasena) return
    onSubmit?.({ correo, contrasena })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
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
          placeholder="••••••••"
          autoComplete="current-password"
          value={contrasena}
          onChange={(event) => setContrasena(event.target.value)}
          minLength={8}
          required
        />
      </label>

      <button type="submit" className="auth-form__submit" disabled={isSubmitting}>
        {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}

export default LoginForm
