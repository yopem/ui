"use client"

import type React from "react"

import { themeClasses } from "@registry/theme/theme-root"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"

type Theme = "dark" | "light" | "system"
type ResolvedTheme = Exclude<Theme, "system">

const STORAGE_KEY = "yopem-ui-theme"
const MEDIA_QUERY = "(prefers-color-scheme: dark)"

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.remove(...themeClasses.light, ...themeClasses.dark)
  root.classList.add(
    ...themeClasses.marker,
    ...(theme === "dark" ? themeClasses.dark : themeClasses.light),
  )
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

function subscribeToSystemTheme(callback: () => void) {
  const media = matchMedia(MEDIA_QUERY)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

function getSystemTheme(): ResolvedTheme {
  return matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

function getServerTheme(): ResolvedTheme {
  return "light"
}

function getStoredTheme(defaultTheme: Theme) {
  if (typeof localStorage === "undefined") return defaultTheme
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved === "dark" || saved === "light" || saved === "system"
    ? saved
    : defaultTheme
}

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme(defaultTheme),
  )
  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerTheme,
  )
  const resolvedTheme = theme === "system" ? systemTheme : theme

  useEffect(() => applyTheme(resolvedTheme), [resolvedTheme])

  const setTheme = useCallback((nextTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, nextTheme)
    setThemeState(nextTheme)
  }, [])

  const value = useMemo(
    () => ({ resolvedTheme, setTheme, theme }),
    [resolvedTheme, setTheme, theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error("useTheme must be used within ThemeProvider")
  return value
}
