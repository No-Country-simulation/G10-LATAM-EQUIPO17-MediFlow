import { useState } from 'react'
import Modal from '../../../shared/ui/Modal'
import Select from '../../../shared/ui/Select'
import { ETIQUETA_ROL } from '../../../app/session'
import { OPCIONES_ROL_CAMBIO } from '../types/roles'

function ChangeRoleModal({ usuario, onClose, onConfirmar }) {
  const [rol, setRol] = useState(usuario?.rol || 'paciente')

  const handleConfirmar = () => {
    onConfirmar?.(usuario.id, rol)
  }

  return (
    <Modal open={Boolean(usuario)} onClose={onClose} title="Cambiar rol de usuario">
      {usuario && (
        <div className="change-role">
          <p className="change-role__description">
            Cambiarás el rol de <strong>{usuario.nombre}</strong> ({usuario.email}).
            El rol actual es{' '}
            <strong>{usuario.rol ? ETIQUETA_ROL[usuario.rol] : '—'}</strong>.
          </p>

          <label className="change-role__field">
            <span className="change-role__label">Nuevo rol</span>
            <Select
              id="nuevo-rol"
              name="nuevo-rol"
              value={rol}
              onChange={(event) => setRol(event.target.value)}
              options={OPCIONES_ROL_CAMBIO}
              ariaLabel="Nuevo rol del usuario"
            />
          </label>

          <div className="change-role__actions">
            <button type="button" className="change-role__cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="change-role__confirm" onClick={handleConfirmar}>
              Guardar rol
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default ChangeRoleModal