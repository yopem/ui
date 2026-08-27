import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

export const rootStyles = stylex.create({
  body: {
    backgroundColor: tokens.background,
    color: tokens.foreground,
    fontFamily: tokens.fontSans,
    minHeight: "100vh",
  },
  html: {
    backgroundColor: tokens.background,
    colorScheme: "light",
    color: tokens.foreground,
    fontFamily: tokens.fontSans,
  },
})
