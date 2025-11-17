import { Link } from "react-router-dom";

export default function PremiumCancelPage() {
  return (
    <section className="auth-page">
      <div className="auth-card auth-card--status">
        <h1>Checkout canceled</h1>
        <p className="auth-card__subtitle">
          No worries — you can rejoin anytime. Your account still has access to the free weekly unlock.
        </p>
        <Link to="/premium" className="auth-form__submit auth-form__submit--link">
          Return to Premium Page
        </Link>
      </div>
    </section>
  );
}
