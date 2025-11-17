import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import api from "./apiClient.js";
import QBPropsBoardPage from "./pages/QBPropsBoardPage.jsx";
import PlayerDetailPage from "./pages/PlayerDetailPage.jsx";
import BigBPicksPage from "./pages/BigBPicksPage.jsx";
import PremiumPage from "./pages/PremiumPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import PremiumSuccessPage from "./pages/PremiumSuccessPage.jsx";
import PremiumCancelPage from "./pages/PremiumCancelPage.jsx";
import AppHeader from "./components/AppHeader.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { qbList } from "./qbData.js";
import "./App.css";

const ID_FALLBACK_PREFIX = "qb";
const EDITABLE_UI = false;

const PROP_KEYS = ["pass_att", "completions", "pass_yds", "pass_td", "rush_yds", "rush_td", "int_line"];

const EMPTY_PROPS = PROP_KEYS.reduce((acc, key) => {
  acc[key] = null;
  return acc;
}, {});

function slugifyName(name = "") {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `${ID_FALLBACK_PREFIX}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyProps() {
  return { ...EMPTY_PROPS };
}

function normalizeProps(propSource = {}, fallbacks = {}) {
  const normalized = createEmptyProps();
  PROP_KEYS.forEach((key) => {
    const rawValue = propSource[key];
    if (rawValue !== undefined && rawValue !== null && rawValue !== "") {
      normalized[key] = rawValue;
      return;
    }
    const fallbackValue = fallbacks[key];
    normalized[key] = fallbackValue ?? null;
  });
  return normalized;
}

function createBoardEntryFromMeta(meta) {
  const normalizedId = String(meta.id ?? slugifyName(meta.name));
  return {
    id: normalizedId,
    name: meta.name ?? "Unnamed QB",
    team: meta.team ?? "",
    opponent: "",
    projectionWeek: "",
    projPassAtt: null,
    props: createEmptyProps(),
    imageUrl: meta.imageUrl ?? null,
  };
}

function mergeSheetDataWithMetadata(sheetRows = []) {
  const metadataById = new Map(qbList.map((qb) => [String(qb.id), qb]));
  const metadataByName = new Map(qbList.map((qb) => [qb.name.toLowerCase(), qb]));
  const usedIds = new Set();

  const merged = sheetRows.map((row) => {
    const sheetId = row.player_id ? String(row.player_id) : null;
    const nameKey = row.name ? row.name.toLowerCase() : null;
    const metadata = (sheetId && metadataById.get(sheetId)) || (nameKey && metadataByName.get(nameKey)) || {};

    const id = String(metadata.id ?? sheetId ?? slugifyName(row.name || metadata.name));

    usedIds.add(id);

    const fallbackProps = {
      pass_att: row.pass_att,
      completions: row.completions,
      pass_yds: row.pass_yds,
      pass_td: row.pass_td,
      rush_yds: row.rush_yds,
      rush_td: row.rush_td,
      int_line: row.int_line,
    };

    return {
      id,
      name: row.name || metadata.name || "Unnamed QB",
      team: row.team || metadata.team || "",
      opponent: row.opponent || metadata.opponent || "",
      projectionWeek: row.projectionWeek || row.projection_week || metadata.projectionWeek || "",
      projPassAtt:
        row.pass_att
        ?? row.projPassAtt
        ?? row.props?.pass_att
        ?? row.bettingProps?.pass_att
        ?? metadata.projPassAtt
        ?? null,
      props: normalizeProps(row.props || row.bettingProps || {}, fallbackProps),
      imageUrl: metadata.imageUrl ?? null,
    };
  });

  qbList.forEach((meta) => {
    const metaId = String(meta.id ?? slugifyName(meta.name));
    if (!usedIds.has(metaId)) {
      merged.push(createBoardEntryFromMeta(meta));
    }
  });

  return merged;
}

export default function App() {
  const [qbProps, setQbProps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadQBLines() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get("/api/qb-lines");
        const data = response?.data;

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No QB lines found in Google Sheets.");
        }

        const merged = mergeSheetDataWithMetadata(data);
        if (!isCancelled) {
          setQbProps(merged);
        }
      } catch (err) {
        console.error("Failed to load QB lines:", err);
        if (!isCancelled) {
          setError(err.message);
          setQbProps([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadQBLines();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppHeader />
        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={(
            <QBPropsBoardPage
              qbProps={qbProps}
              loading={loading}
              error={error}
              editable={EDITABLE_UI}
            />
          )}
            />
            <Route
              path="/players/:playerId"
              element={<PlayerDetailPage qbProps={qbProps} editable={EDITABLE_UI} />}
            />
            <Route path="/bigb-picks" element={<BigBPicksPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/premium/success" element={<PremiumSuccessPage />} />
            <Route path="/premium/cancel" element={<PremiumCancelPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
