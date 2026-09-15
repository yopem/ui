import { tokens } from "@registry/styles/tokens.stylex"
import { useTheme } from "@registry/theme/theme-provider"
import * as stylex from "@stylexjs/stylex"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

const themeOptions = [
  { icon: MonitorIcon, label: "Auto", value: "system" },
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <fieldset aria-label="Appearance" {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.options)}>
        {themeOptions.map(({ icon: Icon, label, value }) => (
          <button
            aria-label={label}
            aria-pressed={theme === value}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
            {...stylex.props(styles.option, theme === value && styles.active)}
          >
            <Icon aria-hidden size={14} strokeWidth={1.75} />
          </button>
        ))}
      </div>
    </fieldset>
  )
}

const styles = stylex.create({
  root: {
    borderWidth: 0,
    borderBlockStart: `1px solid ${tokens["--border"]}`,
    margin: 0,
    minInlineSize: 0,
    padding: "0.5rem 1rem",
  },
  options: {
    backgroundColor: tokens["--muted"],
    borderRadius: tokens["--radius-lg"],
    display: "grid",
    gap: "0.25rem",
    gridTemplateColumns: "repeat(3, 1fr)",
    inlineSize: "7rem",
    marginInline: "auto",
    padding: "0.1875rem",
  },
  option: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderRadius: tokens["--radius-md"],
    color: tokens["--muted-foreground"],
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    minBlockSize: {
      default: "2rem",
      "@media (pointer: coarse)": "2.75rem",
    },
    padding: 0,
    ":hover": { color: tokens["--foreground"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 1,
    },
  },
  active: {
    backgroundColor: tokens["--card"],
    boxShadow: "0 1px 2px color-mix(in oklab, #000 12%, transparent)",
    color: tokens["--foreground"],
    fontWeight: 600,
  },
})
