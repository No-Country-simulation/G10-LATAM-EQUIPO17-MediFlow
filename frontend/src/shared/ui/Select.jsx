import './Select.css'

function Select({ id, name, value, onChange, options = [], ariaLabel, disabled = false, className }) {
  return (
    <div className={className ? `mf-select ${className}` : 'mf-select'}>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="mf-select__caret" aria-hidden="true" />
    </div>
  )
}

export default Select