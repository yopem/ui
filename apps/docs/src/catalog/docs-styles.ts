import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

export const docsStyles = stylex.create({
  link: {
    color: tokens["--foreground"],
    textDecoration: "underline",
    textDecorationColor: tokens["--border"],
    textUnderlineOffset: "0.25em",
    borderRadius: tokens["--radius-sm"],
    ":hover": { textDecorationColor: tokens["--foreground"] },
    ":focus-visible": {
      outline: `2px solid ${tokens["--ring"]}`,
      outlineOffset: 4,
    },
  },
})

export const catalogStyles = stylex.create({
  card: {
    backgroundColor: {
      default: tokens["--card"],
      ":hover": tokens["--accent"],
    },
    borderColor: {
      default: tokens["--border"],
      ":hover": tokens["--ring"],
    },
    borderRadius: tokens["--radius-xl"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    display: "flex",
    flexDirection: "column",
    fontFamily: tokens["--font-sans"],
    gap: "0.5rem",
    minBlockSize: "10.5rem",
    minInlineSize: 0,
    padding: "1.25rem",
    textDecorationLine: "none",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 3,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
})
