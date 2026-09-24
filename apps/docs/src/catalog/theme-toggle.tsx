import { tokens } from "@registry/styles/tokens.stylex"
import { useTheme } from "@registry/theme/theme-provider"
import * as stylex from "@stylexjs/stylex"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
const styles = stylex.create({
  appearance: {
    borderWidth: 0,
    margin: "calc(var(--spacing) * 0)",
    minInlineSize: "calc(var(--spacing) * 0)",
    padding: "0.5rem 1rem",
  },
  grid: {
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius-lg"],
    display: "grid",
    gap: "0.25rem",
    gridTemplateColumns: "repeat(3, 1fr)",
    inlineSize: "7rem",
    marginInline: "auto",
    paddingBlock: "0.1875rem",
    paddingInline: "0.1875rem",
  },
  button: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      ":is([aria-pressed=true], [data-pressed])": tokens["--card"],
    },
    borderWidth: 0,
    borderRadius: tokens["--radius-md"],
    color: {
      default: tokens["--muted-foreground"],
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        tokens["--foreground"],
      ":is([aria-pressed=true], [data-pressed])": tokens["--foreground"],
    },
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    minBlockSize: "2.75rem",
    paddingBlock: "calc(var(--spacing) * 0)",
    paddingInline: "calc(var(--spacing) * 0)",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": tokens["--ring"],
    },
    outlineStyle: { ":is(:focus-visible, [data-focus-visible])": "solid" },
    outlineWidth: { ":is(:focus-visible, [data-focus-visible])": 2 },
    outlineOffset: { ":is(:focus-visible, [data-focus-visible])": 1 },
    boxShadow: {
      ":is([aria-pressed=true], [data-pressed])":
        "0 1px 2px color-mix(in oklab, #000 12%, transparent)",
    },
    fontWeight: { ":is([aria-pressed=true], [data-pressed])": 600 },
  },
})
const themeOptions = [
  { icon: MonitorIcon, label: "Auto", value: "system" },
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Box as="fieldset" aria-label="Appearance" xstyle={styles.appearance}>
      <Grid xstyle={styles.grid}>
        {themeOptions.map(({ icon: Icon, label, value }) => (
          <Box
            as="button"
            aria-label={label}
            aria-pressed={theme === value}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
            xstyle={styles.button}
          >
            <Icon aria-hidden size={14} strokeWidth={1.75} />
          </Box>
        ))}
      </Grid>
    </Box>
  )
}
