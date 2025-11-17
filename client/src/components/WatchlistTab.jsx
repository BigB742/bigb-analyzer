const containerStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
};

const buttonStyle = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #555",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

const activeStyle = {
  ...buttonStyle,
  background: "#2f2f2f",
  borderColor: "#999",
};

export default function WatchlistTab({ activeTab, watchlistCount, onChange }) {
  return (
    <div style={containerStyle}>
      <button
        type="button"
        style={activeTab === "all" ? activeStyle : buttonStyle}
        onClick={() => onChange("all")}
      >
        All Players
      </button>
      <button
        type="button"
        style={activeTab === "watchlist" ? activeStyle : buttonStyle}
        onClick={() => onChange("watchlist")}
      >
        Watchlist{watchlistCount > 0 ? ` (${watchlistCount})` : ""}
      </button>
    </div>
  );
}
