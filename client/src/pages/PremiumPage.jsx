import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import bigbLogo from "../assets/bigb-logo-dark.svg";

export default function PremiumPage() {
  const navigate = useNavigate();
  const { isAuthenticated, token, user } = useAuth();
  const [checkoutState, setCheckoutState] = useState({ loading: false, error: null });
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePriceId = import.meta.env.VITE_STRIPE_PRICE_ID;
  const isStripeConfigured = Boolean(publishableKey && stripePriceId);
  const isLoggedIn = Boolean(isAuthenticated);
  const isPremiumUser = Boolean(user?.isPremium);
  const noteText = !isLoggedIn
    ? "Create a free BigB account to claim your weekly QB unlock. Upgrade to Premium to unlock every pass attempts & completions prop."
    : !isPremiumUser
      ? "Upgrade to Premium to unlock every pass attempts & completions prop. As a free member, you can still use one weekly QB unlock on any quarterback."
      : null;

  const handleSignup = () => navigate("/signup");
  const handleLogin = () => navigate("/login");
  const handleViewPicks = () => navigate("/bigb-picks");
  const handleViewProjections = () => navigate("/");

  const handleCheckout = async () => {
    if (!isStripeConfigured) {
      setCheckoutState({ loading: false, error: "Stripe is not configured." });
      return;
    }
    if (!isLoggedIn) {
      navigate("/signup");
      return;
    }
    if (isPremiumUser) return;
    try {
      setCheckoutState({ loading: true, error: null });
      const response = await fetch("/api/premium/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId: stripePriceId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Unable to begin checkout.");
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("Checkout session missing url.");
    } catch (error) {
      setCheckoutState({ loading: false, error: error.message || "Unable to upgrade." });
    } finally {
      setCheckoutState((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <section className="premium-page">
      <div className="premium-page__hero">
        <div className="premium-page__content">
          <div className="premium-page__meta">
            <img src={bigbLogo} alt="BigB logo" className="premium-page__logo" />
            <p className="premium-page__eyebrow">BigB Premium</p>
            <h1>Unlock BigB Premium Picks</h1>
            <p className="premium-page__subtitle">
              Get full access to BigB&apos;s Pass Attempts &amp; Completions props, updated weekly with matchup
              research, film notes, and stat-driven projections.
            </p>
            {noteText && <p className="premium-page__note">{noteText}</p>}
          </div>

          <div className="premium-page__card">
            {isPremiumUser ? (
              <>
                <p className="premium-status">Status: Active Premium Member</p>
                <p className="premium-page__subtitle">
                  Your Premium subscription is active. Enjoy full access to projected pass attempts, completions,
                  and BigB&apos;s premium QB props.
                </p>
                <div className="premium-actions">
                  <button type="button" className="premium-page__cta" onClick={handleViewPicks}>
                    View Premium Picks
                  </button>
                  <button type="button" className="premium-page__cta-outline" onClick={handleViewProjections}>
                    See QB Projections
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="premium-page__price">
                  <span>$7.49</span>
                  <small>/ month</small>
                </p>
                <ul>
                  <li>Full access to premium QB prop picks</li>
                  <li>See projected pass attempts &amp; completions every week</li>
                  <li>Unlock detailed splits &amp; season charts</li>
                  <li>Cancel anytime</li>
                </ul>

                {!isLoggedIn && (
                  <button type="button" className="premium-page__cta" onClick={handleSignup}>
                    Continue to Signup
                  </button>
                )}
                {isLoggedIn && (
                  <button
                    type="button"
                    className="premium-page__cta"
                    onClick={handleCheckout}
                    disabled={checkoutState.loading}
                  >
                    Upgrade with Stripe
                  </button>
                )}
                {checkoutState.error && (
                  <p className="premium-page__error" role="alert">
                    {checkoutState.error}
                  </p>
                )}
                {!isLoggedIn && (
                  <p className="premium-page__hint">
                    Already have an account?{" "}
                    <button type="button" onClick={handleLogin}>
                      Log in
                    </button>
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="premium-page__media">
          {isPremiumUser ? (
            <div className="premium-page__mock premium-page__mock--unlocked">
              <p>Projected Pass Attempts</p>
              <div className="premium-page__unlock-preview">
                <strong>Your Premium access is live</strong>
                <span>Explore BigB&apos;s pass attempts &amp; completions props across every QB matchup.</span>
                <Link to="/bigb-picks">Go to BigB&apos;s Premium Picks →</Link>
              </div>
            </div>
          ) : (
            <div className="premium-page__mock">
              <p>Projected Pass Attempts</p>
              <div className="premium-page__lock-preview">
                <span className="premium-page__lock-icon">🔒</span>
                <strong>Premium pick locked</strong>
                <span>Create an account and upgrade to see the exact line.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!isStripeConfigured && (
        <div className="premium-error">
          Stripe is not configured. Set VITE_STRIPE_PUBLISHABLE_KEY and VITE_STRIPE_PRICE_ID, then restart.
        </div>
      )}
    </section>
  );
}
