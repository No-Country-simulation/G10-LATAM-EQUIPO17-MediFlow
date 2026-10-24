import informacionMetadataPng from '../../../shared/assets/Informacion_Metadata.png'

const MARGEN = 48
const ANCHO_PAGINA = 595.28
const ALTO_PAGINA = 841.89
const ANCHO_CONTENIDO = ANCHO_PAGINA - MARGEN * 2
const LIMITE_INFERIOR = ALTO_PAGINA - MARGEN - 30
const ALTO_ENCABEZADO = 112

const IMAGEN_ENCABEZADO = {
  anchoMaximo: 112,
  altoMaximo: 84,
  separacionTexto: 18,
}

const COLOR = {
  ink: [21, 59, 83],
  muted: [96, 121, 138],
  line: [223, 235, 243],
  accent: [8, 103, 122],
  accentSoft: [234, 246, 249],
  warn: [153, 106, 36],
  warnSoft: [255, 246, 230],
  danger: [164, 75, 75],
  dangerSoft: [255, 240, 239],
}

function limpiarNombreArchivo(documentoId) {
  const id = String(documentoId || 'documento')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `resultado-clinico-${id || 'documento'}.pdf`
}

function cargarImagenPng(url) {
  return new Promise((resolve, reject) => {
    const imagen = new Image()

    imagen.onload = () => {
      const ancho = imagen.naturalWidth
      const alto = imagen.naturalHeight

      if (!ancho || !alto) {
        reject(new Error('La imagen del encabezado no tiene dimensiones válidas.'))
        return
      }

      try {
        const canvas = document.createElement('canvas')
        canvas.width = ancho
        canvas.height = alto
        const contexto = canvas.getContext('2d')

        if (!contexto) {
          reject(new Error('No se pudo preparar la imagen del encabezado.'))
          return
        }

        contexto.drawImage(imagen, 0, 0)
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          ancho,
          alto,
        })
      } catch (error) {
        reject(error)
      }
    }

    imagen.onerror = () => {
      reject(new Error('No se pudo cargar la imagen del encabezado.'))
    }

    imagen.src = url
  })
}

/**
 * Genera el documento PDF en memoria para poder probarlo sin descargarlo.
 *
 * @param {import('../types/triaje.js').ResultadoClinicoVista} vista
 */
export async function generarPdfResultadoClinico(vista) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  let y = MARGEN

  let imagenEncabezado = null
  try {
    imagenEncabezado = await cargarImagenPng(informacionMetadataPng)
  } catch {
    imagenEncabezado = null
  }

  const asegurarEspacio = (alto) => {
    if (y + alto <= LIMITE_INFERIOR) return
    doc.addPage()
    y = MARGEN
  }

  const parrafo = (contenido, { ancho = ANCHO_CONTENIDO, tamano = 10, color = COLOR.ink, altoLinea = 13 } = {}) => {
    const texto = String(contenido || '').trim()
    if (!texto) return
    const lineas = doc.splitTextToSize(texto, ancho)
    const alto = lineas.length * altoLinea
    asegurarEspacio(alto + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(tamano)
    doc.setTextColor(...color)
    doc.text(lineas, MARGEN, y)
    y += alto + 6
  }

  const campo = (etiqueta, valor, { anchoValor = ANCHO_CONTENIDO - 145 } = {}) => {
    const lineas = doc.splitTextToSize(String(valor || 'No disponible'), anchoValor)
    const alto = Math.max(14, lineas.length * 12)
    asegurarEspacio(alto + 6)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR.muted)
    doc.text(etiqueta, MARGEN, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLOR.ink)
    doc.text(lineas, MARGEN + 145, y)
    y += alto + 6
  }

  const vineta = (contenido) => {
    const texto = String(contenido || '').trim()
    if (!texto) return
    const lineas = doc.splitTextToSize(texto, ANCHO_CONTENIDO - 18)
    const alto = lineas.length * 13
    asegurarEspacio(alto + 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COLOR.ink)
    doc.text('•', MARGEN, y)
    doc.text(lineas, MARGEN + 13, y)
    y += alto + 4
  }

  const seccion = (titulo) => {
    asegurarEspacio(36)
    y += 8
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(...COLOR.accent)
    doc.text(titulo, MARGEN, y)
    y += 7
    doc.setDrawColor(...COLOR.line)
    doc.line(MARGEN, y, ANCHO_PAGINA - MARGEN, y)
    y += 16
  }

  const recortarAlAncho = (texto, ancho) => {
    if (doc.getTextWidth(texto) <= ancho) return texto

    let recorte = texto
    while (recorte.length > 0 && doc.getTextWidth(`${recorte}…`) > ancho) {
      recorte = recorte.slice(0, -1)
    }
    return `${recorte}…`
  }

  // Encabezado
  doc.setFillColor(...COLOR.accent)
  doc.rect(0, 0, ANCHO_PAGINA, ALTO_ENCABEZADO, 'F')

  let limiteTextoEncabezado = ANCHO_PAGINA - MARGEN

  if (imagenEncabezado) {
    const escala = Math.min(
      IMAGEN_ENCABEZADO.anchoMaximo / imagenEncabezado.ancho,
      IMAGEN_ENCABEZADO.altoMaximo / imagenEncabezado.alto,
    )
    const anchoImagen = imagenEncabezado.ancho * escala
    const altoImagen = imagenEncabezado.alto * escala
    const xImagen = ANCHO_PAGINA - MARGEN - anchoImagen
    const yImagen = (ALTO_ENCABEZADO - altoImagen) / 2

    doc.addImage(
      imagenEncabezado.dataUrl,
      'PNG',
      xImagen,
      yImagen,
      anchoImagen,
      altoImagen,
    )
    limiteTextoEncabezado = xImagen - IMAGEN_ENCABEZADO.separacionTexto
  }

  const anchoTextoEncabezado = Math.max(180, limiteTextoEncabezado - MARGEN)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  const titulo = 'Resultado Clínico — MediFlow'
  const anchoTitulo = doc.getTextWidth(titulo)
  if (anchoTitulo > anchoTextoEncabezado) {
    doc.setFontSize(20 * (anchoTextoEncabezado / anchoTitulo))
  }
  doc.setTextColor(255, 255, 255)
  doc.text(titulo, MARGEN, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(222, 246, 249)
  doc.text('Informe generado por el Agente MediFlow', MARGEN, 68)
  doc.setFontSize(9)
  doc.text(`Procesado: ${vista.fechaProcesamiento}`, MARGEN, 87)
  const prefijoDocumento = 'Documento: '
  const anchoNombre = Math.max(40, anchoTextoEncabezado - doc.getTextWidth(prefijoDocumento))
  const nombreLinea = recortarAlAncho(String(vista.archivoNombre), anchoNombre)
  doc.text(`${prefijoDocumento}${nombreLinea}`, MARGEN, 100)
  y = ALTO_ENCABEZADO + 24

  seccion('Datos del documento')
  campo('Archivo analizado', vista.archivoNombre)
  campo('Identificador', vista.documentoId)
  campo('Estado', vista.estado)
  campo('Fecha del documento', vista.fechaDocumento)
  campo('Fecha de procesamiento', vista.fechaProcesamiento)
  if (vista.lote && vista.lote.total > 1) {
    campo(
      'Lote',
      `${vista.lote.completados} de ${vista.lote.total} completados · ${vista.lote.errores} con error`,
    )
  }

  seccion('Resumen del documento')
  if (vista.resumen) {
    parrafo(vista.resumen)
  } else {
    parrafo(
      'El backend no proporcionó un resumen narrativo para este documento. La información clínica estructurada disponible se presenta a continuación.',
      { color: COLOR.muted, tamano: 9.5 },
    )
  }

  seccion('Información clínica identificada')
  campo('Tipo de documento', vista.tipoDocumento)
  campo('Especialidad', vista.especialidad)
  campo('Prioridad', vista.prioridad)
  campo('Revisión humana', vista.revisionHumana ? 'Requerida' : 'No requerida')
  campo('Destino', vista.destino)
  campo(
    'Campos extraídos',
    `${vista.cantidadCampos} ${
      vista.cantidadCampos === 1 ? 'campo identificado' : 'campos identificados'
    }`,
  )
  campo('Medicamentos', vista.medicamentos.texto)
  campo('Persistencia', vista.persistencia.texto)

  seccion('Campos extraídos')
  if (vista.campos.length === 0) {
    parrafo(
      vista.medicamentos.estado === 'lista'
        ? 'No se identificaron campos estructurados adicionales. Los medicamentos se detallan en la información clínica.'
        : 'No se identificaron campos clínicos estructurados en la respuesta del agente.',
      { color: COLOR.muted, tamano: 9.5 },
    )
  } else {
    vista.campos.forEach((item) => campo(item.etiqueta, item.valor))
  }

  seccion('Hallazgos relevantes')
  if (vista.hallazgos.principal) {
    const lineas = doc.splitTextToSize(vista.hallazgos.principal, ANCHO_CONTENIDO - 24)
    const alto = lineas.length * 13 + 22
    asegurarEspacio(alto + 8)
    doc.setFillColor(...COLOR.warnSoft)
    doc.roundedRect(MARGEN, y - 11, ANCHO_CONTENIDO, alto, 6, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR.warn)
    doc.text('Hallazgo principal', MARGEN + 12, y + 1)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(lineas, MARGEN + 12, y + 16)
    y += alto + 8
  }

  if (vista.hallazgos.observaciones.length > 0) {
    vista.hallazgos.observaciones.forEach((observacion) => vineta(observacion))
  } else if (!vista.hallazgos.principal) {
    parrafo('No se identificaron observaciones relevantes en la respuesta del agente.', {
      color: COLOR.muted,
      tamano: 9.5,
    })
  }

  seccion('Estado del procesamiento')
  campo('Estado', vista.estado)
  campo('Tiempo de procesamiento', vista.tiempo)
  campo('Campos extraídos', String(vista.cantidadCampos))
  campo('Confianza de clasificación', vista.confianza)

  if (vista.lote?.errores > 0) {
    const aviso =
      'Este informe corresponde únicamente al documento seleccionado. El lote incluyó documentos con error que no se incluyen en este PDF.'
    const lineas = doc.splitTextToSize(aviso, ANCHO_CONTENIDO - 24)
    const alto = lineas.length * 12 + 20
    asegurarEspacio(alto + 10)
    doc.setFillColor(...COLOR.dangerSoft)
    doc.roundedRect(MARGEN, y - 10, ANCHO_CONTENIDO, alto, 6, 6, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR.danger)
    doc.text(lineas, MARGEN + 12, y + 4)
    y += alto + 10
  }

  seccion('Nota')
  parrafo(
    'Informe generado a partir de la respuesta del agente. No reemplaza la revisión clínica. No se incluyen los datos identificables del paciente ni del médico extraídos por el agente.',
    { color: COLOR.muted, tamano: 8.5, altoLinea: 11 },
  )

  // Pie de página
  const totalPaginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina)
    doc.setDrawColor(...COLOR.line)
    doc.line(MARGEN, ALTO_PAGINA - 38, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 38)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR.muted)
    doc.text('MediFlow · Resultado Clínico', MARGEN, ALTO_PAGINA - 24)
    doc.text(`Página ${pagina} de ${totalPaginas}`, ANCHO_PAGINA - MARGEN, ALTO_PAGINA - 24, {
      align: 'right',
    })
  }

  return doc
}

/**
 * Genera y descarga el PDF del resultado seleccionado.
 *
 * @param {import('../types/triaje.js').ResultadoClinicoVista} vista
 */
export async function descargarPdfResultadoClinico(vista) {
  const doc = await generarPdfResultadoClinico(vista)
  doc.save(limpiarNombreArchivo(vista.documentoId))
}
