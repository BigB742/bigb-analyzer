import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PremiumModal from "./PremiumModal.jsx";

export default function BecomePremiumCTA({ align = "center" }) {
  const [open, setOpen] = useState(false);
  const modifier = ["left", "right", "center"].includes(align) ? align : "center";
  const navigate = useNavigate();

  const handleUpgrade = () => {
    setOpen(false);
    navigate("/premium");
  };

  return (
    <>
      <div className={`premium-cta premium-cta--${modifier}`}>
        <button
          type="button"
          className="premium-cta__button"
          onClick={() => setOpen(true)}
        >
          Become Premium
        </button>
      </div>
      <PremiumModal open={open} onClose={() => setOpen(false)} onUpgrade={handleUpgrade} />
    </>
  );
}
