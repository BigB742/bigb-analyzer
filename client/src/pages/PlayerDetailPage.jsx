import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Avatar from "../components/Avatar.jsx";
import Section from "../components/player/Section.jsx";
import StatCard, { formatStatValue } from "../components/player/StatCard.jsx";
import BecomePremiumCTA from "../components/BecomePremiumCTA.jsx";
import PremiumStatValue from "../components/PremiumStatValue.jsx";
import { qbList } from "../qbData.js";
import { getTeamMeta } from "../teamMeta.js";
import { useAuth } from "../context/AuthContext.jsx";

const STAT_FIELDS = [
  { key: "pass_att", label: "Pass Att" },
  { key: "completions", label: "Comp" },
  { key: "pass_yds", label: "Pass Yds" },
  { key: "pass_td", label: "Pass TD" },
  { key: "interceptions", label: "INT" },
  { key: "rush_yds", label: "Rush Yds" },
  { key: "rush_td", label: "Rush TD" },
];

const LOCKED_STAT_FIELDS = new Set(["pass_att", "completions"]);

function formatProjectionWeekLabel(rawWeek) {
  if (!rawWeek) return "";
  const match = String(rawWeek).match(/week\s*#?\s*(\d+)/i);
  if (match) {
    return `Week ${match[1]}`;
  }
  return String(rawWeek);
}

function PassingYardsChart({ data }) {
  const chartData = Array.isArray(data)
    ? data
        .filter(
          (point) =>
            point
            && Number.isFinite(point?.yards)
            && point.weekLabel
            && point.weekLabel.trim().toLowerCase() !== "average",
        )
        .map((point) => ({
          ...point,
          yards: Number(point.yards),
        }))
    : [];

  if (!chartData.length) {
    return (
      <div className="passing-chart-card">
        <div className="passing-chart-card__header">
          <h3>Passing Yards by Game</h3>
        </div>
        <p className="passing-chart-card__empty">No passing yards logged yet.</p>
      </div>
    );
  }

  return (
    <div className="passing-chart-card">
      <div className="passing-chart-card__header">
        <h3>Passing Yards by Game</h3>
      </div>
      <div className="passing-chart-card__body">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 4, left: -10 }}>
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              interval="preserveStartEnd"
              tickLine={{ stroke: "#1f2937" }}
              axisLine={{ stroke: "#1f2937" }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              width={40}
              tickLine={{ stroke: "#1f2937" }}
              axisLine={{ stroke: "#1f2937" }}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                borderRadius: 12,
                border: "1px solid #1f2937",
                color: "#e2e8f0",
              }}
              formatter={(value) => [`${value} yds`, "Passing Yards"]}
              labelFormatter={(label) => `Game: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="yards"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ stroke: "#4F46E5", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#fcd34d", stroke: "#4F46E5" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function PlayerDetailPage({ qbProps }) {
  const { playerId } = useParams();
  const [searchParams] = useSearchParams();
  const qbFallback = useMemo(
    () => qbList.find((player) => String(player.id) === playerId),
    [playerId],
  );
  const qb = qbProps.find((player) => String(player.id) === playerId) || qbFallback;
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedOpponent = qb?.opponent || searchParams.get("opponent") || "";

  useEffect(() => {
    if (!playerId) return;
    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (selectedOpponent) {
          query.set("opponent", selectedOpponent);
        }
        const queryString = query.toString();
        const response = await fetch(`/api/qb/${playerId}/details${queryString ? `?${queryString}` : ""}`);
        const data = await response.json();
        if (!response.ok) {
          const message = data?.message || "Failed to load player details.";
          throw new Error(message);
        }
        if (!cancelled) {
          setDetail(data);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(err.message);
          setDetail(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [playerId, selectedOpponent]);

  if (!qb) {
    return (
      <section className="player-detail">
        <div className="player-detail__card">
          <p className="empty-state">Player not found.</p>
          <Link to="/" className="player-detail__back">
            ← Back to Quarterback Stat Projections
          </Link>
        </div>
      </section>
    );
  }

  const seasonStats = detail?.season || {};
  const homeStats = detail?.home || {};
  const awayStats = detail?.away || {};
  const hasDetailData = Boolean(
    detail
      && (
        Object.keys(seasonStats).length
        || Object.keys(homeStats).length
        || Object.keys(awayStats).length
      ),
  );
  const headerOpponent = detail?.opponentLabel || detail?.opponent || qb.opponent || selectedOpponent || "vs —";
  const projectionWeekLabel = formatProjectionWeekLabel(detail?.projectionWeek || qb?.projectionWeek);
  const teamMeta = getTeamMeta(detail?.team || qb.team);
  const passingYardsByGame = detail?.passingYardsByGame || [];
  const { user, currentWeek } = useAuth();
  const isPremiumUser = Boolean(user?.isPremium);
  const weeklyUnlock = user?.weeklyUnlock || {};
  const isWeeklyUnlocked = Boolean(
    weeklyUnlock?.playerId
      && weeklyUnlock?.week === (currentWeek ?? weeklyUnlock?.week)
      && weeklyUnlock?.playerId === qb.id,
  );
  const isUnlockedForUser = isPremiumUser || isWeeklyUnlocked;

  const resolvePremiumStat = (fieldKey, formattedValue) => {
    if (!LOCKED_STAT_FIELDS.has(fieldKey)) return formattedValue;
    return isUnlockedForUser ? formattedValue : <PremiumStatValue />;
  };

  const renderLockedValue = (fieldKey, formattedValue) => resolvePremiumStat(fieldKey, formattedValue);

  return (
    <section className="player-detail">
      <div className="player-detail__card">
        <Link to="/" className="player-detail__back">
          ← Back to Quarterback Stat Projections
        </Link>

        <div className="player-detail__header">
          <Avatar name={qb.name} imageUrl={qb.imageUrl} size={96} />
          <div className="player-detail__header-content">
            <div className="player-detail__team">
              {teamMeta.logoUrl ? (
                <img
                  src={teamMeta.logoUrl}
                  alt={teamMeta.name}
                  className="player-detail__team-logo"
                  loading="lazy"
                />
              ) : null}
              <div>
                <h2 className="player-detail__name">{detail?.name || qb.name}</h2>
                <p className="player-detail__meta">
                  Team: {teamMeta.name} • {projectionWeekLabel || "Week —"} {headerOpponent}
                </p>
                {!isUnlockedForUser && (
                  <p className="premium-note">
                    Use your weekly QB unlock or upgrade to Premium to reveal PASS ATT &amp; COMP stats.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading && <p className="player-detail__status">Loading Google Sheets data…</p>}
        {!loading && error && (
          <p className="player-detail__status player-detail__status--error">
            {error || "Unable to load player details."}
          </p>
        )}

        {!loading && !error && !hasDetailData && (
          <p className="player-detail__status">No detailed stats yet for this player.</p>
        )}

        {hasDetailData && (
          <div className="player-detail__sections">
            <PassingYardsChart data={passingYardsByGame} />
            {Object.keys(seasonStats).length ? (
              <Section title="Season Averages">
                <div className="stat-summary-grid">
                  {STAT_FIELDS.map((field) => {
                    const formattedValue = formatStatValue(seasonStats[field.key]);
                    const displayValue = resolvePremiumStat(field.key, formattedValue);
                    return (
                      <div key={field.key} className="stat-summary-grid__item">
                        <span className="stat-summary-grid__label">{field.label}</span>
                        <span className="stat-summary-grid__value">{displayValue}</span>
                      </div>
                    );
                  })}
                </div>
              </Section>
            ) : null}

            <Section title="Home vs Away Averages">
              <div className="home-away-grid">
                <StatCard
                  title="Home Games Average"
                  stats={homeStats}
                  fields={STAT_FIELDS}
                  renderValue={renderLockedValue}
                />
                <StatCard
                  title="Away Games Average"
                  stats={awayStats}
                  fields={STAT_FIELDS}
                  renderValue={renderLockedValue}
                />
              </div>
            </Section>
            {!isPremiumUser && <BecomePremiumCTA align="right" />}
          </div>
        )}

        <p className="detail-footer">Data source: Google Sheets (auto-sync)</p>
      </div>
    </section>
  );
}
