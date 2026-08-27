import { themeMarker } from "@registry/styles/markers.stylex"
import { rootStyles } from "@registry/styles/root"
import { darkTheme, lightTheme } from "@registry/styles/themes"
import * as stylex from "@stylexjs/stylex"

const lightClassName = stylex.props(lightTheme).className ?? ""
const darkClassName = stylex.props(darkTheme).className ?? ""
const markerClassName = stylex.props(themeMarker).className ?? ""

export const themeClasses = {
  dark: darkClassName.split(" ").filter(Boolean),
  light: lightClassName.split(" ").filter(Boolean),
  marker: markerClassName.split(" ").filter(Boolean),
} as const

export const themeClassNames = {
  dark: darkClassName,
  light: lightClassName,
  marker: markerClassName,
} as const

export function getRootThemeProps(theme: "dark" | "light" = "light") {
  return stylex.props(
    themeMarker,
    theme === "dark" ? darkTheme : lightTheme,
    rootStyles.html,
  )
}
