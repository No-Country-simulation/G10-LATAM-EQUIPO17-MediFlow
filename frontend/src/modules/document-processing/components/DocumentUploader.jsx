import { useRef } from 'react'

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function DocumentIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="22" height="24" rx="5" fill="var(--color-mf-bg-3)" />
      <path d="M10 10h10M10 15h10M10 20h6" stroke="var(--color-mf-sky)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function DocumentUploader({ file, error, disabled, onFileSelected }) {
  const inputRef = useRef(null)

  const validateFile = (candidate) => {
    if (!candidate) return

    if (!ALLOWED_TYPES.includes(candidate.type)) {
      onFileSelected(null, 'Formato no permitido. Selecciona un PDF, PNG o JPG.')
      return
    }

    if (candidate.size > MAX_FILE_SIZE) {
      onFileSelected(null, 'El archivo supera el límite permitido de 10 MB.')
      return
    }

    onFileSelected(candidate, '')
  }

  const handleDrop = (event) => {
    event.preventDefault()
    if (!disabled) validateFile(event.dataTransfer.files[0])
  }

  return (
    <div className="document-uploader">
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        disabled={disabled}
        onChange={(event) => validateFile(event.target.files[0])}
      />
      <button
        className={`upload-zone ${file ? 'upload-zone--selected' : ''}`}
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="upload-zone__icon"><DocumentIcon /></span>
        <span className="upload-zone__title">{file ? file.name : 'Selecciona o arrastra un documento'}</span>
        <span className="upload-zone__hint">PDF, PNG o JPG · máximo 10 MB</span>
      </button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}

export default DocumentUploader
