import { useEffect, useRef } from "react";

export default function PremiumModal({ open, onClose, onUpgrade }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !modalRef.current) return undefined;

    const container = modalRef.current;
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusable = () => Array.from(container.querySelectorAll(focusableSelectors));

    const focusEls = getFocusable();
    focusEls[0]?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (document.activeElement === first || document.activeElement === container) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="premium-modal__overlay" onClick={handleOverlayClick} role="presentation">
      <div
        className="premium-modal"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="premium-modal-title"
      >
        <button
          type="button"
          className="premium-modal__close"
          onClick={onClose}
          aria-label="Close premium dialog"
        >
          ×
        </button>
        <h3 id="premium-modal-title">Become a Premium Member</h3>
        <p className="premium-modal__price">$7.49 / month – cancel anytime</p>
        <ul className="premium-modal__benefits">
          <li>Full access to every Premium Pass Attempts &amp; Completions pick</li>
          <li>See my exact line, projection, and pick before the market moves</li>
          <li>All premium results tracked on this page for full transparency</li>
        </ul>
        <div className="premium-modal__actions">
          <button
            type="button"
            className="premium-modal__primary"
            onClick={() => {
              if (onUpgrade) {
                onUpgrade();
              } else {
                onClose();
              }
            }}
          >
            Get Premium
          </button>
          <button type="button" className="premium-modal__secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
