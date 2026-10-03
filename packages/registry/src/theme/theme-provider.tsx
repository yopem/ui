"use client"

import type { ReactNode } from "react"

import { useEventCallback } from "@registry/hooks/use-event-callback"
import {
  MEDIA_QUERY,
  STORAGE_KEY,
  themeConfig,
  type ResolvedTheme,
  type Theme,
  type ThemeConfig,
} from "@registry/theme/theme"
import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from "react"

function subscribeToSystemTheme(callback: () => void) {
  const media = matchMedia(MEDIA_QUERY)
  media.addEventListener("change", callback)

  return () => media.removeEventListener("change", callback)
}

function getSystemTheme() {
  return matchMedia(MEDIA_QUERY).matches ? "dark" : "light"
}

function getServerTheme() {
  return "light" as const
}

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback)

  return () => window.removeEventListener("storage", callback)
}

function getServerPreference() {
  return null
}

export interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
  themes?: ThemeConfig
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
  themes = themeConfig,
}: ThemeProviderProps) {
  const [preference, setThemeState] = useState<Theme | null>(null)

  function getStoredTheme() {
    try {
      const saved = localStorage.getItem(storageKey)

      if (saved === "light" || saved === "dark" || saved === "system")
        return saved
    } catch {
      // Storage can be blocked. Use the configured default instead.
    }

    return defaultTheme
  }

  const storedTheme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    getServerPreference,
  )

  const theme = preference ?? storedTheme ?? defaultTheme
  const ready = storedTheme !== null

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    getServerTheme,
  )

  const resolvedTheme = theme === "system" ? systemTheme : theme

  useLayoutEffect(() => {
    if (!ready) return
    const root = document.documentElement
    root.classList.remove(...themes.classes.light, ...themes.classes.dark)
    root.classList.add(...themes.classes[resolvedTheme])
    root.dataset.theme = resolvedTheme

    return () => root.classList.remove(...themes.classes[resolvedTheme])
  }, [ready, resolvedTheme, themes])

  const setTheme = useEventCallback(function (nextTheme: Theme) {
    try {
      localStorage.setItem(storageKey, nextTheme)
    } catch {
      // Blocked storage must not prevent changing the current theme.
    }

    setThemeState(nextTheme)
  })

  const [value, setValue] = useState({ resolvedTheme, setTheme, theme })

  if (value.resolvedTheme !== resolvedTheme || value.theme !== theme) {
    setValue({ resolvedTheme, setTheme, theme })
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)

  if (!value) throw new Error("useTheme must be used within ThemeProvider")

  return value
}
