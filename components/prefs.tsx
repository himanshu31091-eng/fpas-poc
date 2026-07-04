"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "admin" | "ops" | "viewer";

export const ROLES: { id: Role; label: string; desc: string }[] = [
  { id: "admin", label: "Admin", desc: "Full access incl. settings" },
  { id: "ops", label: "Operations", desc: "Create & work jobs" },
  { id: "viewer", label: "Viewer", desc: "Read-only" },
];

/** Demo staff for assignments. First entry is the signed-in user. */
export const STAFF = ["Himanshu Pandey", "Sanne de Vries", "Diederik Bakker", "Marta Ruiz"];

/** Selectable colour themes (accent driven by CSS vars in globals.css). */
export type ThemeId = "teal" | "indigo" | "violet" | "forest" | "sunset" | "slate";

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "teal", label: "Teal", swatch: "#12657E" },
  { id: "indigo", label: "Indigo", swatch: "#314EA0" },
  { id: "violet", label: "Violet", swatch: "#7C3AAD" },
  { id: "forest", label: "Forest", swatch: "#227A47" },
  { id: "sunset", label: "Sunset", swatch: "#C0601E" },
  { id: "slate", label: "Slate", swatch: "#475569" },
];

type Tone = "default" | "success" | "error";
interface ToastItem {
  id: number;
  msg: string;
  tone: Tone;
}

interface PrefsValue {
  hydrated: boolean;
  role: Role;
  setRole: (r: Role) => void;
  signedIn: boolean;
  signIn: (r: Role) => void;
  signOut: () => void;
  canEdit: boolean;
  isAdmin: boolean;
  user: string;
  dark: boolean;
  toggleDark: () => void;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  toast: (msg: string, tone?: Tone) => void;
}

const Ctx = createContext<PrefsValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [role, setRoleState] = useState<Role>("admin");
  const [signedIn, setSignedIn] = useState(false);
  const [dark, setDark] = useState(false);
  const [theme, setThemeState] = useState<ThemeId>("teal");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    try {
      const r = window.localStorage.getItem("fpas.role") as Role | null;
      if (r) setRoleState(r);
      if (window.localStorage.getItem("fpas.signedin") === "1") setSignedIn(true);
      if (window.localStorage.getItem("fpas.dark") === "1") {
        setDark(true);
        document.documentElement.classList.add("dark");
      }
      const t = window.localStorage.getItem("fpas.theme") as ThemeId | null;
      if (t && THEMES.some((x) => x.id === t)) {
        setThemeState(t);
        document.documentElement.setAttribute("data-theme", t);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    try {
      window.localStorage.setItem("fpas.role", r);
    } catch {
      /* ignore */
    }
  }, []);

  const signIn = useCallback(
    (r: Role) => {
      setRole(r);
      setSignedIn(true);
      try {
        window.localStorage.setItem("fpas.signedin", "1");
      } catch {
        /* ignore */
      }
    },
    [setRole]
  );

  const signOut = useCallback(() => {
    setSignedIn(false);
    try {
      window.localStorage.setItem("fpas.signedin", "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      try {
        window.localStorage.setItem("fpas.dark", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    try {
      window.localStorage.setItem("fpas.theme", t);
    } catch {
      /* ignore */
    }
  }, []);

  const toast = useCallback((msg: string, tone: Tone = "default") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const value = useMemo<PrefsValue>(
    () => ({
      hydrated,
      role,
      setRole,
      signedIn,
      signIn,
      signOut,
      canEdit: role !== "viewer",
      isAdmin: role === "admin",
      user: STAFF[0],
      dark,
      toggleDark,
      theme,
      setTheme,
      toast,
    }),
    [
      hydrated,
      role,
      setRole,
      signedIn,
      signIn,
      signOut,
      dark,
      toggleDark,
      theme,
      setTheme,
      toast,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} />
    </Ctx.Provider>
  );
}

export function usePrefs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePrefs must be used within AppProvider");
  return c;
}

function ToastViewport({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="no-print pointer-events-none fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-fade-up rounded-xl px-4 py-2.5 text-sm font-medium shadow-lift ${
            t.tone === "success"
              ? "bg-green text-white"
              : t.tone === "error"
              ? "bg-red text-white"
              : "bg-ink text-white"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
