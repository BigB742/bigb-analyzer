import QBGrid from "../components/QBGrid.jsx";
import BecomePremiumCTA from "../components/BecomePremiumCTA.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function QBPropsBoardPage({ qbProps, loading, error, editable }) {
  const hasQBs = qbProps?.length > 0;
  const { isAuthenticated } = useAuth();

  const renderStatus = () => {
    if (loading) {
      return <p className="qb-page__status">Loading QB prop lines…</p>;
    }
    if (error) {
      return (
        <p className="qb-page__status qb-page__status--error">
          Could not load QB props: {error}
        </p>
      );
    }
    if (!hasQBs) {
      return <p className="empty-state">No quarterbacks available.</p>;
    }
    return null;
  };

  return (
    <section className="qb-page">
      <div className="qb-page__content">
        <header className="qb-page__header">
          <div>
            <h1 className="qb-page__title">Quarterback Stat Projections</h1>
            <p className="qb-page__subtitle">
              Projected stat lines for each quarterback&apos;s next game. Click a player to see full season stats.
            </p>
            <p className="qb-page__updated">Projections updated every Wednesday at 2:00 PM PT.</p>
            {!isAuthenticated && (
              <p className="premium-note">
                Create a free BigB account to use your weekly Premium unlock on one QB stat.
              </p>
            )}
          </div>
        </header>

        <div className="qb-page__status-group">
          {renderStatus()}
        </div>
        {!loading && !error && hasQBs && <QBGrid qbProps={qbProps} editable={editable} />}
        <BecomePremiumCTA align="center" />
      </div>
    </section>
  );
}
