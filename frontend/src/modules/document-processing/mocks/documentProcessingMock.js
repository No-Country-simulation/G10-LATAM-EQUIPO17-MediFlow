export const PROCESSING_STEPS = [
  { id: 'received', label: 'Documento recibido', detail: 'Archivo listo para analizar' },
  { id: 'classified', label: 'Tipo identificado', detail: 'Reconociendo la categoría clínica' },
  { id: 'extracted', label: 'Datos extraídos', detail: 'Organizando información relevante' },
  { id: 'routed', label: 'Destino determinado', detail: 'Definiendo la siguiente acción' },
]

// Mock temporal: reproduce la forma visual del resultado esperado del triaje.
export const MOCK_PROCESSING_RESULT = {
  status: 'procesado',
  documento_id: 'DOC-MOCK-2026-001',
  clasificacion: {
    tipo_documento: 'Informe de Laboratorio',
    especialidad: 'Medicina general',
    nivel_prioridad: 'rutina',
    score_confianza_clasificacion: 0.94,
  },
  datos_extraidos: {
    paciente: { nombre: 'Paciente de prueba', edad: 42 },
    medico_solicitante: { nombre: 'Dr. Usuario de prueba', matricula: 'TEST-001' },
    estudio_realizado: 'Perfil bioquímico',
    diagnostico_principal: 'Resultado dentro de parámetros de prueba',
  },
  decision_enrutamiento: {
    destino_principal: 'Historia clínica electrónica',
    requiere_auditoria_humana: false,
  },
}
