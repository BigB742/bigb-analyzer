const headerStyle = {
  fontWeight: 600,
  lineHeight: 1.2,
  textAlign: "center",
  padding: "8px 10px",
  whiteSpace: "pre-line",
};

const nameCellStyle = {
  textAlign: "left",
  padding: "8px 10px",
};

const numericCellStyle = {
  textAlign: "right",
  padding: "6px 10px",
  fontVariantNumeric: "tabular-nums",
};

const centeredCellStyle = {
  textAlign: "center",
  padding: "6px 8px",
};

const starButtonStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: 18,
  lineHeight: 1,
};

function formatStatValue(value, hasStats) {
  if (!hasStats) {
    if (value === null || value === undefined) return "—";
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && numeric === 0) return "—";
  }
  if (value === null || value === undefined) return "0";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toString();
}

export default function PlayersTable({ players, statColumns, watchlistSet, onToggleWatchlist }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ ...headerStyle, width: 40 }}>★</th>
          <th style={nameCellStyle}>Name</th>
          <th style={headerStyle}>Team</th>
          <th style={headerStyle}>Pos</th>
          {statColumns.map((col) => (
            <th key={col.key} style={headerStyle}>{col.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {players.map((p) => {
          const id = String(p.player_id || p.playerId || p.externalId || p._id);
          const starred = watchlistSet.has(id);
          const hasStats = p.has_stats !== undefined ? Boolean(p.has_stats) : true;
          return (
            <tr key={id}>
              <td style={{ ...centeredCellStyle, width: 40 }}>
                <button
                  type="button"
                  onClick={() => onToggleWatchlist(id)}
                  aria-label={starred ? "Remove from watchlist" : "Add to watchlist"}
                  style={starButtonStyle}
                >
                  {starred ? "⭐" : "☆"}
                </button>
              </td>
              <td style={nameCellStyle}>{p.name}</td>
              <td style={centeredCellStyle}>{p.team || "FA"}</td>
              <td style={centeredCellStyle}>{p.position}</td>
              {statColumns.map((col) => {
                const raw = typeof col.accessor === "function" ? col.accessor(p) : p[col.key];
                return (
                  <td key={col.key} style={numericCellStyle}>{formatStatValue(raw, hasStats)}</td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
