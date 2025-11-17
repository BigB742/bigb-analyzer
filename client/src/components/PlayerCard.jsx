import { useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import PropFieldValue from "./PropFieldValue.jsx";
import PremiumStatValue from "./PremiumStatValue.jsx";
import { PROP_FIELDS, getPropFieldValue } from "../utils/propFields.js";
import { getTeamBrand } from "../teamBranding.js";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../apiClient.js";

export default function PlayerCard({ qb, editable = false, onPropChange }) {
  const {
    user,
    isAuthenticated,
    token,
    setUser,
    currentWeek,
  } = useAuth();
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState(null);
  const isPremiumUser = Boolean(user?.isPremium);
  const weeklyUnlock = user?.weeklyUnlock || {};
  const activeWeek = currentWeek ?? null;
  const hasUnlockThisWeek = Boolean(weeklyUnlock?.playerId) && weeklyUnlock?.week === activeWeek;
  const isUnlockedCard = isPremiumUser || (hasUnlockThisWeek && weeklyUnlock?.playerId === qb.id);
  const handleFieldChange = (fieldKey, newValue) => {
    if (!editable || typeof onPropChange !== "function") return;
    onPropChange(qb.id, fieldKey, newValue);
  };

  const brand = getTeamBrand(qb.team);

  const formatOpponent = (label) => {
    if (!label) return "vs —";
    return /^(vs|@)/i.test(label) ? label : `vs ${label}`;
  };
  const opponentLabel = formatOpponent(qb.opponent);
  const matchupLabel = [qb.projectionWeek, opponentLabel].filter(Boolean).join(" • ");
  const fieldMap = PROP_FIELDS.reduce((acc, field) => ({ ...acc, [field.key]: field }), {});
  const displayStats = [
    { key: "projPassAtt", label: "Proj Pass Att", premium: true },
    { key: "passYds", label: "Proj Pass Yds" },
    { key: "passTD", label: "Proj Pass TD" },
    { key: "interceptions", label: "Proj INT" },
    { key: "rushYds", label: "Proj Rush Yds" },
    { key: "rushTD", label: "Proj Rush TD" },
  ];

  const getFieldValue = (key) => {
    const field = fieldMap[key] || { key };
    return getPropFieldValue(qb, field);
  };

  const formatDisplayValue = (value) => {
    if (value === undefined || value === null || value === "") return "—";
    return value;
  };

  const handleUseUnlock = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isAuthenticated || isPremiumUser || hasUnlockThisWeek || unlocking) return;
    setUnlockError(null);
    setUnlocking(true);
    try {
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await api.post(
        "/api/weekly-unlock",
        { playerId: qb.id, playerName: qb.name },
        { headers },
      );
      if (response?.data?.user) {
        setUser(response.data.user);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err.message || "Unable to use weekly unlock.";
      setUnlockError(message);
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Link to={`/players/${qb.id}`} className="player-card-link">
      <article className="player-card" style={{ borderColor: brand.primary }}>
        <div className="player-card__head">
          <Avatar name={qb.name} imageUrl={qb.imageUrl} />
          <div className="player-card__info">
            <p className="player-card__name">{qb.name}</p>
            <div className="player-card__meta">
              <span
                className="team-pill"
                style={{ backgroundColor: brand.primary, color: "#fff" }}
              >
                {qb.team || "—"}
              </span>
              {matchupLabel && <span className="player-card__matchup">{matchupLabel}</span>}
            </div>
          </div>
        </div>

        <div className="player-card__projection">
          <span className="player-card__projection-label">Stat-Based Player Projection</span>
          {!isPremiumUser && isAuthenticated && (
            <div className="player-card__unlock">
              {isUnlockedCard ? (
                <span className="weekly-unlock__badge">Weekly QB Unlocked</span>
              ) : hasUnlockThisWeek ? (
                <span className="weekly-unlock__badge weekly-unlock__badge--used">
                  Weekly unlock already used
                </span>
              ) : (
                <button
                  type="button"
                  className="weekly-unlock__button"
                  onClick={handleUseUnlock}
                  disabled={unlocking}
                >
                  {unlocking ? "Unlocking…" : "Use Weekly Unlock"}
                </button>
              )}
              {unlockError && <p className="weekly-unlock__error">{unlockError}</p>}
            </div>
          )}
        </div>

        {editable ? (
          <div className="player-card__inputs">
            {PROP_FIELDS.map((field) => (
              <PropFieldValue
                key={field.key}
                label={field.label}
                value={getPropFieldValue(qb, field)}
                type={field.type}
                placeholder={field.placeholder}
                editable
                onChange={(value) => handleFieldChange(field.key, value)}
              />
            ))}
          </div>
        ) : (
          <div className="player-card__stat-grid">
            {displayStats.map((stat) => (
              <div className="player-card__stat-tile" key={stat.key}>
                <span className="player-card__stat-label">{stat.label}</span>
                <span className="player-card__stat-value">
                  {stat.premium && !isUnlockedCard
                    ? <PremiumStatValue />
                    : formatDisplayValue(getFieldValue(stat.key))}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
