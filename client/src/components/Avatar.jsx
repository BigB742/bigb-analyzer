import { useState } from "react";

function getInitials(name = "") {
  const [first = "", second = ""] = name.split(" ");
  const initials = `${first.charAt(0)}${second.charAt(0)}`.trim();
  return initials.toUpperCase() || "?";
}

export default function Avatar({ name, imageUrl, size = 64 }) {
  const [hasError, setHasError] = useState(false);
  const showImage = Boolean(imageUrl) && !hasError;

  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {showImage ? (
        <img
          src={imageUrl}
          alt={`${name} headshot`}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
