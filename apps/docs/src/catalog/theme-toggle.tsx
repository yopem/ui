import { Button } from "@registry/components/ui/button"
import { useEventCallback } from "@registry/hooks/use-event-callback"
import { useTheme } from "@registry/theme/theme-provider"
import * as stylex from "@stylexjs/stylex"
import { useHydrated } from "@tanstack/react-router"
import { MoonIcon, SunIcon } from "lucide-react"

const styles = stylex.create({ button: { borderWidth: 0 } })

export function ThemeToggle() {
  const hydrated = useHydrated()
  const { resolvedTheme, setTheme } = useTheme()
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark"

  const toggleTheme = useEventCallback(function () {
    setTheme(nextTheme)
  })

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      disabled={!hydrated}
      onClick={toggleTheme}
      xstyle={styles.button}
    >
      {resolvedTheme === "dark" ? (
        <SunIcon aria-hidden size={20} />
      ) : (
        <MoonIcon aria-hidden size={20} />
      )}
    </Button>
  )
}
