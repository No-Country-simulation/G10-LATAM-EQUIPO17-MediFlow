export const directories = [
  {
    id: 'laboratorio',
    title: 'Laboratorio',
    subtitle: 'Análisis y bioquímica',
    file: { name: 'resultado_laboratorio.pdf', type: 'PDF' },
    detected: ['Paciente detectado', 'Resultado clínico', 'Prioridad evaluada'],
  },
  {
    id: 'recetas',
    title: 'Recetas',
    subtitle: 'Prescripciones',
    file: { name: 'receta_medica.jpg', type: 'IMG' },
    detected: ['Paciente', 'Médico', 'Medicamento', 'Dosis'],
  },
  {
    id: 'informes',
    title: 'Informes clínicos',
    subtitle: 'Epicrisis y evolución',
    file: { name: 'informe_clinico.pdf', type: 'PDF' },
    detected: ['Paciente', 'Diagnóstico', 'Especialidad', 'CIE-10'],
  },
  {
    id: 'procedimientos',
    title: 'Procedimientos',
    subtitle: 'Órdenes y solicitudes',
    file: { name: 'orden_procedimiento.png', type: 'PNG' },
    detected: ['Paciente', 'Procedimiento', 'Prioridad', 'Área destino'],
  },
]