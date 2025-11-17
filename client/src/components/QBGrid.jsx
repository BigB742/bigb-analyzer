import PlayerCard from "./PlayerCard.jsx";

export default function QBGrid({ qbProps, editable }) {
  if (!qbProps?.length) {
    return <p className="empty-state">No quarterbacks available.</p>;
  }

  return (
    <div className="qb-grid">
      {qbProps.map((qb) => (
        <PlayerCard key={qb.id} qb={qb} editable={editable} />
      ))}
    </div>
  );
}
