import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthVisualPanel from '../components/AuthVisualPanel'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import { saveSession } from '../../../app/session'
import { iniciarSesion, registrarUsuario, obtenerMensajeAuth } from '../services/authService'
import './AuthPage.css'

function AuthPage() {
  const navigate = useNavigate()
  const [modo, setModo] = useState('login')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const esLogin = modo === 'login'

  const handleLogin = async (data) => {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const resultado = await iniciarSesion({
        email: data.correo,
        password: data.contrasena,
      })

      saveSession({
        nombre: resultado.usuario.nombre,
        email: resultado.usuario.email,
        rol: resultado.usuario.rol,
      })

      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(obtenerMensajeAuth(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (data) => {
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const resultado = await registrarUsuario({
        nombre: data.nombre,
        email: data.correo,
        password: data.contrasena,
      })

      saveSession({
        nombre: resultado.usuario.nombre,
        email: resultado.usuario.email,
        rol: resultado.usuario.rol,
      })

      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(obtenerMensajeAuth(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo)
    setErrorMessage('')
  }

  return (
    <main className="auth-page">
      <section className="auth-page__visual" aria-label="Presentación de MediFlow">
        <AuthVisualPanel />
      </section>

      <section className="auth-page__panel">
        <div className="auth-right__inner">
          <header className="auth-right__topbar">
            <span className="auth-right__portal">Portal Sanitario Profesional</span>
            <span className="auth-right__support">
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M3.5 5.5C3.5 3 5 1.8 8 1.8s4.5 1.2 4.5 3.7M3.9 14.2h.9a.9.9 0 0 0 .9-.9v-1.5A.9.9 0 0 0 4.8 11H3.9a1 1 0 0 0-1 1v1.2a1 1 0 0 0 1 1ZM11.2 14.2h.9a1 1 0 0 0 1-1V12a1 1 0 0 0-1-1h-.9a.9.9 0 0 0-.9.9v1.4a.9.9 0 0 0 .9.9Z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Soporte Asistencial
            </span>
          </header>

          <div className="auth-card">
            <Link className="auth-card__back" to="/">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M9.5 4 5.5 8l4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Volver al inicio
            </Link>

            <div className="auth-card__tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={`auth-card__tab ${esLogin ? 'is-active' : ''}`}
                aria-selected={esLogin}
                onClick={() => cambiarModo('login')}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                role="tab"
                className={`auth-card__tab ${!esLogin ? 'is-active' : ''}`}
                aria-selected={!esLogin}
                onClick={() => cambiarModo('registro')}
              >
                Registrarse
              </button>
            </div>

            <h2 className="auth-card__title">
              {esLogin ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h2>
            <p className="auth-card__subtitle">
              {esLogin
                ? 'Accede a tu espacio de trabajo en MediFlow.'
                : 'Regístrate para comenzar a usar MediFlow.'}
            </p>

            {esLogin ? (
              <LoginForm onSubmit={handleLogin} isSubmitting={isSubmitting} />
            ) : (
              <RegisterForm onSubmit={handleRegister} isSubmitting={isSubmitting} />
            )}

            {errorMessage && (
              <p className="auth-card__error" role="alert">
                {errorMessage}
              </p>
            )}
          </div>

          <footer className="auth-right__footer">
            <p className="auth-right__footer-txt">
              Al {esLogin ? 'iniciar sesión en' : 'registrarte en'} MediFlow, aceptas nuestros{' '}
              <a href="#terminos">Términos del Servicio Clínico</a> y la{' '}
              <a href="#privacidad">Política de Protección de Datos de Salud</a>.
            </p>
            <p className="auth-right__footer-copy">
              © 2026 MediFlow Healthcare AI Technologies. Todos los derechos reservados.
            </p>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
