export function formatStatValue(value) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toString() : Number(value).toFixed(1);
  }
  return String(value);
}

export default function StatCard({ title, stats = {}, fields, className = "", renderValue }) {
  const getDisplayValue = (fieldKey) => {
    const formatted = formatStatValue(stats[fieldKey]);
    if (typeof renderValue === "function") {
      return renderValue(fieldKey, formatted, stats[fieldKey]);
    }
    return formatted;
  };

  return (
    <div className={`stat-card ${className}`.trim()}>
      {title ? <p className="stat-card__title">{title}</p> : null}
      <div className="stat-card__grid">
        {fields.map((field) => (
          <div key={field.key} className="stat-summary-grid__item">
            <span className="stat-summary-grid__label">{field.label}</span>
            <span className="stat-summary-grid__value">{getDisplayValue(field.key)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
