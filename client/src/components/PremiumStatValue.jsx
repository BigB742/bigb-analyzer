export default function PremiumStatValue() {
  return (
    <span className="premium-lock" aria-label="Premium stat locked">
      <span className="premium-lock__value">—</span>
      <span className="premium-lock__overlay">
        <span aria-hidden="true">🔒</span>
        Premium
      </span>
    </span>
  );
}
