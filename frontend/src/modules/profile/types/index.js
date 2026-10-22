/**
 * @typedef {Object} PerfilUsuario
 * @property {string} id Identificador del usuario.
 * @property {string} nombre Nombre completo.
 * @property {string} email Correo electrónico.
 * @property {'admin'|'medico'|'paciente'} rol Rol asignado.
 * @property {boolean} activo Cuenta activa o no.
 * @property {string|null} created_at Fecha de creación (ISO).
 * @property {string|null} last_login Último acceso (ISO).
 */

/**
 * @typedef {Object} PerfilGuardado
 * @property {string} nombre Nombre guardado localmente.
 * @property {string} email Correo guardado localmente.
 * @property {string} actualizado_en Fecha ISO del último guardado.
 */

export {};
