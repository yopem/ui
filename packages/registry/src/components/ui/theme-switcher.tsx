"use client"

import type { ButtonProps } from "@registry/components/ui/button"

import { Button } from "@registry/components/ui/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@registry/components/ui/toggle-group"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { useTheme } from "@registry/theme/theme-provider"
import { MoonIcon, SunIcon } from "lucide-react"
import { useSyncExternalStore } from "react"

export type ThemeControlProps = Pick<
  ButtonProps,
  "className" | "disabled" | "xstyle"
>

const themeValues = {
  light: ["light"],
  dark: ["dark"],
  system: ["system"],
}

function subscribeToHydration() {
  return () => undefined
}

function getClientSnapshot() {
  return true
}

function getServerSnapshot() {
  return false
}

function useThemeControlReady() {
  return useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  )
}

export function ThemeToggle({ disabled = false, ...props }: ThemeControlProps) {
  const ready = useThemeControlReady()
  const { resolvedTheme, setTheme } = useTheme()
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark"
  const label = `Switch to ${nextTheme} theme`
  const toggleTheme = useEventCallback(() => setTheme(nextTheme))

  return (
    <Button
      {...props}
      data-slot="theme-toggle"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled || !ready}
      onClick={toggleTheme}
    >
      {nextTheme === "light" ? (
        <SunIcon aria-hidden size={20} />
      ) : (
        <MoonIcon aria-hidden size={20} />
      )}
    </Button>
  )
}

export function ThemeSwitcher({
  disabled = false,
  ...props
}: ThemeControlProps) {
  const ready = useThemeControlReady()
  const { theme, setTheme } = useTheme()

  const changeTheme = useEventCallback(([nextTheme]: readonly string[]) => {
    if (
      nextTheme === "light" ||
      nextTheme === "dark" ||
      nextTheme === "system"
    ) {
      setTheme(nextTheme)
    }
  })

  return (
    <ToggleGroup
      {...props}
      data-slot="theme-switcher"
      aria-label="Color theme"
      size="sm"
      disabled={disabled || !ready}
      value={themeValues[theme]}
      onValueChange={changeTheme}
    >
      <ToggleGroupItem value="light">Light</ToggleGroupItem>
      <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
      <ToggleGroupItem value="system">System</ToggleGroupItem>
    </ToggleGroup>
  )
}
