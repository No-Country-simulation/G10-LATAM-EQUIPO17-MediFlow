/**
 * @typedef {Object} SolicitudTriaje
 * @property {string} documento_id Identificador único del documento.
 * @property {string} tipo_archivo Tipo físico: "PDF" | "imagen" | "texto".
 * @property {string} [documento_texto] Texto extraído cuando aplica.
 * @property {string} [canal_origen] Canal de ingreso del documento (default "manual").
 */

/**
 * @typedef {Object} ClasificacionDocumento
 * @property {string} tipo_documento Tipo clínico reconocido.
 * @property {string} especialidad Especialidad asociada.
 * @property {string} nivel_prioridad "rutina" | "urgente" | "emergencia".
 * @property {number} score_confianza_clasificacion Confianza 0..1.
 */

/**
 * @typedef {Object} DatosExtraidos
 * @property {{nombre?: string, edad?: number}} paciente
 * @property {{nombre?: string, matricula?: string}} medico_solicitante
 * @property {string|null} estudio_realizado
 * @property {string|null} diagnostico_principal
 * @property {string|null} cie10_sugerido
 * @property {Array<string>|null} medicamentos
 * @property {Array<string>|null} dosis
 */

/**
 * @typedef {Object} DecisionEnrutamiento
 * @property {string} destino_principal Cola o destino clínico.
 * @property {boolean} requiere_auditoria_humana
 * @property {string} justificacion_enrutamiento
 */

/**
 * @typedef {Object} RespuestaTriaje
 * @property {string} status Estado del procesamiento.
 * @property {string} documento_id
 * @property {ClasificacionDocumento} clasificacion
 * @property {DatosExtraidos} datos_extraidos
 * @property {DecisionEnrutamiento} decision_enrutamiento
 */

export {};