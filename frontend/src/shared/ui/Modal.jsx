import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

function Modal({ open, onClose, title, children, ariaLabel }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="mf-modal" role="presentation">
      <div className="mf-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="mf-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
      >
        <header className="mf-modal__header">
          {title && <h3 className="mf-modal__title">{title}</h3>}
          <button type="button" className="mf-modal__close" onClick={onClose} aria-label="Cerrar">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 3l8 8M11 3l-8 8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="mf-modal__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export default Modal