import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API } from "./AuthContext";
import DEFAULT_THEME from "../theme/defaultTheme";

const ThemeContext = createContext(null);

function deepMerge(target, source) {
  if (!source) return target;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
}

function themeToCssVars(theme) {
  const vars = {};
  if (!theme) return vars;
  const c = theme.colors || {};
  Object.entries(c).forEach(([k, v]) => { if (v) vars[`--theme-${k.replace(/([A-Z])/g, "-$1").toLowerCase()}`] = v; });
  const t = theme.typography || {};
  if (t.primaryFont) vars["--theme-font-primary"] = t.primaryFont;
  if (t.headingFont) vars["--theme-font-heading"] = t.headingFont;
  if (t.bodyFont) vars["--theme-font-body"] = t.bodyFont;
  if (t.buttonFont) vars["--theme-font-button"] = t.buttonFont;
  const l = theme.layout || {};
  if (l.pageMaxWidth) vars["--theme-max-width"] = l.pageMaxWidth;
  if (l.borderRadius) vars["--theme-radius"] = l.borderRadius;
  if (l.buttonRadius) vars["--theme-button-radius"] = l.buttonRadius;
  if (l.shadow) vars["--theme-shadow"] = l.shadow;
  return vars;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/theme/published")
      .then((res) => {
        if (res.data) setTheme(deepMerge(DEFAULT_THEME, res.data));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cssVars = themeToCssVars(theme);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(cssVars).forEach(([k, v]) => root.style.setProperty(k, v));
    return () => {
      Object.keys(cssVars).forEach((k) => root.style.removeProperty(k));
    };
  }, [cssVars]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading, deepMerge, DEFAULT_THEME }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: DEFAULT_THEME, loading: false };
  return ctx;
}

export { DEFAULT_THEME, deepMerge, themeToCssVars };
