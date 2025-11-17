import { Link } from "react-router-dom";

export default function PremiumSuccessPage() {
  return (
    <section className="auth-page">
      <div className="auth-card auth-card--status">
        <h1>Payment Complete</h1>
        <p className="auth-card__subtitle">
          Thanks for upgrading! Premium access will activate shortly — refresh the page in a few moments to unlock
          every stat.
        </p>
        <Link to="/" className="auth-form__submit auth-form__submit--link">
          Back to QB Projections
        </Link>
      </div>
    </section>
  );
}
