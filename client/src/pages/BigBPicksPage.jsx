import { useEffect, useMemo, useState } from "react";
import BecomePremiumCTA from "../components/BecomePremiumCTA.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../apiClient.js";

const PREMIUM_MARKETS = new Set(["pass attempts", "pass completions", "completions"]);

function isPremiumMarket(market) {
  return PREMIUM_MARKETS.has((market || "").trim().toLowerCase());
}


function formatNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric % 1 === 0 ? numeric.toString() : numeric.toFixed(1);
  }
  return value;
}

function formatPercentage(value) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function ResultBadge({ result }) {
  const normalized = (result || "").toUpperCase();
  if (normalized === "W") {
    return <span className="picks-result picks-result--win">W</span>;
  }
  if (normalized === "L") {
    return <span className="picks-result picks-result--loss">L</span>;
  }
  return <span className="picks-result picks-result--pending">Pending</span>;
}

function PicksTable({ rows, emptyMessage, cellRenderers = {} }) {
  const getCell = (key, fallback, pick) =>
    typeof cellRenderers[key] === "function" ? cellRenderers[key](pick, fallback) : fallback;

  return (
    <div className="picks-table-card">
      <div className="picks-table-wrapper">
        <table className="picks-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Date</th>
              <th>QB / Matchup</th>
              <th>Market</th>
              <th className="align-right">Line</th>
              <th className="align-right">Projection</th>
              <th>Pick</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pick, idx) => {
              const matchup = [pick.team, pick.opponent].filter(Boolean).join(" vs ");
              return (
                <tr key={`${pick.week}-${pick.qb}-${pick.market}-${idx}`}>
                  <td className="muted">{pick.week || "—"}</td>
                  <td className="muted">{pick.date || "—"}</td>
                  <td>
                    <div className="picks-table__player">
                      <span>{pick.qb || "—"}</span>
                      {matchup && <small>{matchup}</small>}
                    </div>
                  </td>
                  <td>{pick.market || "—"}</td>
                  <td className="align-right">{getCell("line", formatNumber(pick.line), pick)}</td>
                  <td className="align-right">
                    {getCell("projection", formatNumber(pick.projection), pick)}
                  </td>
                  <td>{getCell("pick", pick.pick || "—", pick)}</td>
                  <td>{getCell("result", <ResultBadge result={pick.result} />, pick)}</td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={8} className="picks-table__empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LockedCell({ value }) {
  return (
    <span className="premium-cell premium-cell--obfuscated" aria-label="Premium pick locked">
      <span className="premium-cell__value">{value}</span>
      <span className="premium-cell__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img" focusable="false">
          <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Zm-3 0H10V7a2 2 0 0 1 4 0Zm3 9H7v-7h10Z" />
          <circle cx="12" cy="14" r="1.5" />
        </svg>
      </span>
    </span>
  );
}

export default function BigBPicksPage() {
  const [picks, setPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadPicks(forceRefresh = false) {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }
      const response = await api.get(`/api/bigb-picks${forceRefresh ? "?forceRefresh=1" : ""}`);
      const data = response?.data;
      setPicks(Array.isArray(data?.picks) ? data.picks : []);
    } catch (err) {
      console.error("Failed to fetch picks:", err);
      setError(err.message || "Unable to load picks right now.");
      setPicks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadPicks(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradedPicks = useMemo(
    () => picks.filter((pick) => ["W", "L"].includes((pick.result || "").toUpperCase())),
    [picks],
  );
  const wins = gradedPicks.filter((pick) => (pick.result || "").toUpperCase() === "W").length;
  const losses = gradedPicks.filter((pick) => (pick.result || "").toUpperCase() === "L").length;
  const winPct = gradedPicks.length ? wins / gradedPicks.length : null;

  const premiumPicks = useMemo(
    () => picks.filter((pick) => isPremiumMarket(pick.market)),
    [picks],
  );
  const freePicks = useMemo(
    () => picks.filter((pick) => !isPremiumMarket(pick.market)),
    [picks],
  );

  const { user } = useAuth();
  const isPremiumUser = Boolean(user?.isPremium);
  const weeklyUnlock = user?.weeklyUnlock || {};
  const unlockedPlayerId = weeklyUnlock?.playerId || null;
  const unlockedPlayerName = weeklyUnlock?.playerName || null;
  const unlockedWeek = weeklyUnlock?.week ?? null;

  const normalizeName = (value) => (value || "").toLowerCase().replace(/\s+/g, " ").trim();

  const isRowUnlocked = (row) => {
    if (isPremiumUser) return true;
    if (!unlockedWeek || !row.weekNumber) return false;
    if (Number(row.weekNumber) !== Number(unlockedWeek)) return false;

    const rowPlayerId = row.playerId || null;
    if (rowPlayerId && unlockedPlayerId && rowPlayerId === unlockedPlayerId) {
      return true;
    }

    if (unlockedPlayerName) {
      const rowName = normalizeName(row.qb || row.qbName || row.qbMatchup);
      const unlockName = normalizeName(unlockedPlayerName);
      if (unlockName && rowName && rowName.includes(unlockName)) {
        return true;
      }
    }
    return false;
  };

  const premiumCellRenderers = useMemo(() => {
    if (isPremiumUser) return {};
    return {
      line: (pick, fallback) => (isRowUnlocked(pick) ? fallback : <LockedCell value={fallback} />),
      projection: (pick, fallback) => (isRowUnlocked(pick) ? fallback : <LockedCell value={fallback} />),
      pick: (pick) => (isRowUnlocked(pick) ? pick.pick || "—" : <LockedCell value={pick.pick || "—"} />),
    };
  }, [isPremiumUser, unlockedPlayerId, unlockedWeek]);

  const hasPicks = Boolean(picks.length);

  const renderContent = () => {
    if (loading) {
      return <p className="picks-page__status">Loading picks…</p>;
    }

    if (error) {
      return (
        <p className="picks-page__status picks-page__status--error">
          Could not load BigB&apos;s Picks: {error}
        </p>
      );
    }

    if (!hasPicks) {
      return (
        <p className="picks-page__status picks-page__status--muted">
          No picks logged yet. Add rows to the BigB_Picks sheet to see them here.
        </p>
      );
    }

    return (
      <>
        <div className="picks-summary">
          <div className="picks-summary__stat">
            <span className="picks-summary__label">Total Picks</span>
            <strong>{picks.length}</strong>
          </div>
          <div className="picks-summary__stat">
            <span className="picks-summary__label">Wins</span>
            <strong className="text-win">{wins}</strong>
          </div>
          <div className="picks-summary__stat">
            <span className="picks-summary__label">Losses</span>
            <strong className="text-loss">{losses}</strong>
          </div>
          <div className="picks-summary__stat">
            <span className="picks-summary__label">Win %</span>
            <strong>{formatPercentage(winPct)}</strong>
          </div>
          <button
            type="button"
            className="picks-summary__refresh"
            onClick={() => loadPicks(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh from Sheet"}
          </button>
        </div>

        <section className="picks-section">
          <header>
            <h2>BigB&apos;s Free Picks</h2>
          </header>
          <PicksTable rows={freePicks} emptyMessage="No free picks yet." />
        </section>

        <section className="picks-section picks-section--premium">
          <header>
            <h2>BigB&apos;s Premium Picks</h2>
          </header>
          <PicksTable
            rows={premiumPicks}
            emptyMessage="No premium picks yet."
            cellRenderers={premiumCellRenderers ?? {}}
          />
          {!isPremiumUser && <BecomePremiumCTA align="center" />}
        </section>
      </>
    );
  };

  return (
    <section className="picks-page">
      <div className="picks-page__content">
        <div className="picks-page__header">
          <div>
            <h1 className="picks-page__title">BigB&apos;s Betting Edge</h1>
          </div>
        </div>

        {renderContent()}
      </div>
    </section>
  );
}
