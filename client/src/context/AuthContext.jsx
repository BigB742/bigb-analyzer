import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import api from "../apiClient.js";

const STORAGE_KEY = "bigb-auth";

const initialAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  hasPremium: false,
  freeUnlocksRemaining: 0,
  currentWeek: null,
};

const AuthContext = createContext({
  ...initialAuthState,
  login: () => {},
  logout: () => {},
  setUser: () => {},
  markFreeUnlockUsed: () => {},
  setPremiumActive: () => {},
});

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialAuthState };
    const parsed = JSON.parse(raw);
    const token = parsed?.token || null;
    const user = parsed?.user || null;
    return {
      ...initialAuthState,
      user,
      token,
      isAuthenticated: Boolean(token),
      hasPremium: Boolean(user?.isPremium),
      freeUnlocksRemaining: user?.canUseFreeUnlock ? 1 : 0,
      currentWeek: user?.currentWeek ?? null,
    };
  } catch {
    return { ...initialAuthState };
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => loadStoredAuth());

  useEffect(() => {
    if (state.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.token, state.user]);

  const login = useCallback(({ token, user }) => {
    setState({
      ...initialAuthState,
      token,
      user,
      isAuthenticated: Boolean(token),
      hasPremium: Boolean(user?.isPremium),
      freeUnlocksRemaining: user?.canUseFreeUnlock ? 1 : 0,
      currentWeek: user?.currentWeek ?? null,
    });
  }, []);

  const logout = useCallback(() => {
    setState({ ...initialAuthState });
  }, []);

  const setUser = useCallback((user) => {
    setState((current) => ({
      ...current,
      user,
      hasPremium: Boolean(user?.isPremium),
      freeUnlocksRemaining: user?.canUseFreeUnlock ? 1 : current.freeUnlocksRemaining,
      currentWeek: user?.currentWeek ?? current.currentWeek,
    }));
  }, []);

  const markFreeUnlockUsed = useCallback(() => {
    setState((current) => ({
      ...current,
      freeUnlocksRemaining: Math.max(0, current.freeUnlocksRemaining - 1),
    }));
  }, []);

  const setPremiumActive = useCallback(() => {
    setState((current) => ({
      ...current,
      hasPremium: true,
      user: current.user ? { ...current.user, isPremium: true } : current.user,
    }));
  }, []);

  useEffect(() => {
    if (!state.token) return undefined;
    let cancelled = false;
    async function fetchProfile() {
      try {
        const response = await api.get("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        });
        const data = response?.data;
        if (!cancelled && data?.user) {
          setState((current) => ({
            ...current,
            user: data.user,
            hasPremium: Boolean(data.user.isPremium),
            freeUnlocksRemaining: data.user.canUseFreeUnlock ? 1 : 0,
            currentWeek: data.user.currentWeek ?? current.currentWeek,
          }));
        }
      } catch {
        // ignore fetch errors
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [state.token]);

  const value = useMemo(
    () => ({
      ...state,
      login,
      logout,
      setUser,
      markFreeUnlockUsed,
      setPremiumActive,
    }),
    [state, login, logout, setUser, markFreeUnlockUsed, setPremiumActive],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
