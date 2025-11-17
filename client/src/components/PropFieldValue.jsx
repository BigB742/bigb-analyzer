function formatDisplayValue(value) {
  if (value === undefined || value === null) return "—";
  if (typeof value === "string" && value.trim() === "") return "—";
  return value;
}

export default function PropFieldValue({
  label,
  value,
  type = "text",
  placeholder = "",
  editable = false,
  onChange,
}) {
  const Wrapper = editable ? "label" : "div";
  const displayValue = formatDisplayValue(value);
  const inputValue = value ?? "";

  return (
    <Wrapper className="prop-field">
      <span className="prop-field__label">{label}</span>
      {editable ? (
        <input
          className="prop-input"
          type={type}
          value={inputValue}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div className="prop-input prop-input--display" aria-live="polite">
          {displayValue}
        </div>
      )}
    </Wrapper>
  );
}
