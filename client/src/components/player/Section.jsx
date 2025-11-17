export default function Section({ title, children }) {
  return (
    <section className="detail-section">
      {title ? <h3 className="detail-section__title">{title}</h3> : null}
      {children}
    </section>
  );
}
