import React, { createContext, useContext, useEffect, useState } from "react";

type AccentColor = "green" | "teal" | "blue" | "purple" | "orange" | "rose";
type BorderRadius = "none" | "sm" | "md" | "lg" | "full";

interface AppearanceContextValue {
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  borderRadius: BorderRadius;
  setBorderRadius: (r: BorderRadius) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

const STORAGE_KEY = "boravet_appearance";

const ACCENT_VARS: Record<AccentColor, string> = {
  green:  "111 43% 49%",
  teal:   "174 72% 40%",
  blue:   "217 91% 60%",
  purple: "262 83% 58%",
  orange: "25 95% 53%",
  rose:   "346 77% 49%",
};

const RADIUS_VARS: Record<BorderRadius, string> = {
  none: "0rem",
  sm:   "0.25rem",
  md:   "0.5rem",
  lg:   "0.75rem",
  full: "1rem",
};

function applyAppearance(accent: AccentColor, radius: BorderRadius) {
  const root = document.documentElement;
  root.style.setProperty("--primary", ACCENT_VARS[accent]);
  root.style.setProperty("--radius", RADIUS_VARS[radius]);
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw).accentColor ?? "green") : "green";
    } catch { return "green"; }
  });

  const [borderRadius, setBorderRadiusState] = useState<BorderRadius>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw).borderRadius ?? "md") : "md";
    } catch { return "md"; }
  });

  useEffect(() => {
    applyAppearance(accentColor, borderRadius);
  }, [accentColor, borderRadius]);

  const setAccentColor = (c: AccentColor) => {
    setAccentColorState(c);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ accentColor: c, borderRadius })); } catch {}
  };

  const setBorderRadius = (r: BorderRadius) => {
    setBorderRadiusState(r);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ accentColor, borderRadius: r })); } catch {}
  };

  return (
    <AppearanceContext.Provider value={{ accentColor, setAccentColor, borderRadius, setBorderRadius }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
