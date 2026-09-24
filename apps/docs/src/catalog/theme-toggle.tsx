import { tokens } from "@registry/styles/tokens.stylex"
import { useTheme } from "@registry/theme/theme-provider"
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react"

import { Box } from "@/components/ui/box"
import { Grid } from "@/components/ui/grid"
const themeOptions = [
  { icon: MonitorIcon, label: "Auto", value: "system" },
  { icon: SunIcon, label: "Light", value: "light" },
  { icon: MoonIcon, label: "Dark", value: "dark" },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Box
      as="fieldset"
      aria-label="Appearance"
      borderWidth={0}
      margin={0}
      minInlineSize={0}
      padding={"0.5rem 1rem"}
    >
      <Grid
        backgroundColor={tokens["--muted"]}
        borderRadius={tokens["--radius-lg"]}
        display={"grid"}
        gap={"0.25rem"}
        gridTemplateColumns={"repeat(3, 1fr)"}
        inlineSize={"7rem"}
        marginInline={"auto"}
        padding={"0.1875rem"}
      >
        {themeOptions.map(({ icon: Icon, label, value }) => (
          <Box
            as="button"
            aria-label={label}
            aria-pressed={theme === value}
            key={value}
            onClick={() => setTheme(value)}
            type="button"
            alignItems="center"
            backgroundColor="transparent"
            borderWidth={0}
            borderRadius={tokens["--radius-md"]}
            color={tokens["--muted-foreground"]}
            cursor="pointer"
            display="grid"
            placeItems="center"
            minBlockSize="2.75rem"
            padding={0}
            _hover={{ color: tokens["--foreground"] }}
            _focusVisible={{
              outlineColor: tokens["--ring"],
              outlineStyle: "solid",
              outlineWidth: 2,
              outlineOffset: 1,
            }}
            _pressed={{
              backgroundColor: tokens["--card"],
              boxShadow: "0 1px 2px color-mix(in oklab, #000 12%, transparent)",
              color: tokens["--foreground"],
              fontWeight: 600,
            }}
          >
            <Icon aria-hidden size={14} strokeWidth={1.75} />
          </Box>
        ))}
      </Grid>
    </Box>
  )
}
