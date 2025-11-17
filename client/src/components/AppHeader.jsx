import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_LINKS = [
  { to: "/", label: "QB Projections" },
  { to: "/bigb-picks", label: "BigB's Picks" },
  { to: "/premium", label: "Premium" },
];

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <Link to="/" className="app-header__logo">
          BigB Analyzer
        </Link>
        <nav className="app-header__nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`app-header__nav-link${location.pathname === link.to ? " is-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="app-header__account">
        {!isAuthenticated ? (
          <>
            <Link to="/login" className="app-header__action">
              Login
            </Link>
            <Link to="/signup" className="app-header__action app-header__action--primary">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            <div className="app-header__user">
              <span className="app-header__user-name">Hi, {user?.firstName || "QB Fan"}</span>
              <span className={`app-header__badge ${user?.isPremium ? "is-premium" : ""}`}>
                {user?.isPremium ? "Premium" : "Free"}
              </span>
            </div>
            <button type="button" className="app-header__logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
