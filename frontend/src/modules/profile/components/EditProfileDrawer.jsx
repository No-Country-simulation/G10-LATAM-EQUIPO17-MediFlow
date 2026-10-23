import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRightIcon, CloseIcon } from './ProfileIcons'

const FOCUSABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function EditProfileDrawer({ perfil, onCerrar, onGuardar }) {
  const [nombre, setNombre] = useState(perfil.nombre || '')
  const [email, setEmail] = useState(perfil.email || '')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [error, setError] = useState('')

  const drawerRef = useRef(null)
  const nombreRef = useRef(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    const elementoAnterior = document.activeElement
    const overflowAnterior = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    const frame = window.requestAnimationFrame(() => nombreRef.current?.focus())

    const alPresionarTecla = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrarRef.current()
        return
      }

      if (event.key !== 'Tab' || !drawerRef.current) return

      const focusables = Array.from(drawerRef.current.querySelectorAll(FOCUSABLES))
      if (focusables.length === 0) return

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]

      if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alPresionarTecla)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = overflowAnterior
      if (elementoAnterior instanceof HTMLElement) elementoAnterior.focus()
    }
  }, [])

  const limpiarError = () => {
    if (error) setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nombreLimpio = nombre.trim()
    const emailLimpio = email.trim()

    if (!nombreLimpio) {
      setError('Ingresa tu nombre completo.')
      return
    }

    if (!EMAIL_PATTERN.test(emailLimpio)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    const usaPassword = Boolean(passwordActual || passwordNueva || passwordConfirmar)

    if (usaPassword) {
      if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        setError('Completa todos los campos de contraseña para continuar.')
        return
      }

      if (passwordNueva.length < 8) {
        setError('La nueva contraseña debe tener al menos 8 caracteres.')
        return
      }

      if (passwordNueva !== passwordConfirmar) {
        setError('La nueva contraseña y su confirmación no coinciden.')
        return
      }

      setError(
        'El cambio de contraseña todavía no está disponible porque el backend no expone ese endpoint. Puedes guardar nombre y correo dejando los campos de contraseña vacíos.',
      )
      return
    }

    onGuardar({ nombre: nombreLimpio, email: emailLimpio })
  }

  return createPortal(
    <div
      className="profile-drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCerrar()
      }}
    >
      <aside
        ref={drawerRef}
        className="profile-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-drawer-title"
      >
        <header className="profile-drawer__header">
          <span className="profile-drawer__eyebrow">CONFIGURACIÓN DE CUENTA</span>
          <h2 id="profile-drawer-title">Editar mi perfil</h2>
          <p>Personaliza los datos que ves en este navegador.</p>

          <button
            type="button"
            className="profile-drawer__close"
            onClick={onCerrar}
            aria-label="Cerrar edición de perfil"
          >
            <CloseIcon />
          </button>
        </header>

        <form className="profile-drawer__form" onSubmit={handleSubmit} noValidate>
          <div className="profile-drawer__body">
            <section className="profile-drawer__section" aria-labelledby="profile-section-personal">
              <div className="profile-drawer__section-head">
                <span className="profile-drawer__section-badge" aria-hidden="true">01</span>
                <div>
                  <h3 id="profile-section-personal">Información personal</h3>
                  <p>Datos visibles en tu perfil.</p>
                </div>
              </div>
              <p className="profile-drawer__local-note">Los cambios de nombre y correo solo se guardan en este navegador; no modifican tu cuenta en el servidor.</p>

              <div className="profile-drawer__field">
                <label htmlFor="profile-nombre">Nombre completo</label>
                <input
                  ref={nombreRef}
                  id="profile-nombre"
                  name="nombre"
                  type="text"
                  value={nombre}
                  onChange={(event) => {
                    setNombre(event.target.value)
                    limpiarError()
                  }}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="profile-drawer__field">
                <label htmlFor="profile-email">Correo electrónico</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    limpiarError()
                  }}
                  autoComplete="email"
                  required
                />
              </div>
            </section>

            <div className="profile-drawer__divider" aria-hidden="true" />

            <section className="profile-drawer__section" aria-labelledby="profile-section-password">
              <div className="profile-drawer__section-head">
                <span className="profile-drawer__section-badge" aria-hidden="true">02</span>
                <div>
                  <h3 id="profile-section-password">Cambiar contraseña</h3>
                  <p>El cambio de contraseña aún no está disponible.</p>
                </div>
              </div>

              <div className="profile-drawer__field">
                <label htmlFor="profile-password-actual">Contraseña actual</label>
                <input
                  id="profile-password-actual"
                  name="passwordActual"
                  type="password"
                  placeholder="Ingresa tu contraseña actual"
                  value={passwordActual}
                  onChange={(event) => {
                    setPasswordActual(event.target.value)
                    limpiarError()
                  }}
                  autoComplete="current-password"
                />
              </div>

              <div className="profile-drawer__password-grid">
                <div className="profile-drawer__field">
                  <label htmlFor="profile-password-nueva">Nueva contraseña</label>
                  <input
                    id="profile-password-nueva"
                    name="passwordNueva"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={passwordNueva}
                    onChange={(event) => {
                      setPasswordNueva(event.target.value)
                      limpiarError()
                    }}
                    autoComplete="new-password"
                  />
                </div>

                <div className="profile-drawer__field">
                  <label htmlFor="profile-password-confirmar">Confirmar contraseña</label>
                  <input
                    id="profile-password-confirmar"
                    name="passwordConfirmar"
                    type="password"
                    placeholder="Repite la contraseña"
                    value={passwordConfirmar}
                    onChange={(event) => {
                      setPasswordConfirmar(event.target.value)
                      limpiarError()
                    }}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </section>

            {error ? (
              <p className="profile-drawer__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="profile-drawer__footer">
            <button
              type="button"
              className="profile-drawer__cancel"
              onClick={onCerrar}
            >
              Cancelar
            </button>
            <button type="submit" className="profile-drawer__save">
              Guardar cambios
              <ChevronRightIcon />
            </button>
          </footer>
        </form>
      </aside>
    </div>,
    document.body,
  )
}

export default EditProfileDrawer
