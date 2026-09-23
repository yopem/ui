import * as stylex from "@stylexjs/stylex"

import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Link } from "@/components/ui/link"
export default function Example() {
  return (
    <Box as="nav" aria-label="Project sections">
      <Flex {...stylex.props(styles.root)}>
        <Link
          aria-current="page"
          {...stylex.props(styles.item)}
          href="#overview"
        >
          Overview
        </Link>
        <Link {...stylex.props(styles.item)} href="#activity">
          Activity
        </Link>
        <Link {...stylex.props(styles.item)} href="#settings">
          Settings
        </Link>
      </Flex>
    </Box>
  )
}

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "var(--muted)",
    borderRadius: "0.5rem",
    display: "flex",
    gap: "0.125rem",
    inlineSize: "fit-content",
    justifyContent: "center",
    padding: "0.125rem",
    position: "relative",
    zIndex: 0,
  },
  item: {
    alignItems: "center",
    backgroundColor: {
      default: "transparent",
      "[aria-current=page]": "var(--background)",
    },
    blockSize: { default: "1.875rem", "@media (min-width: 640px)": "1.625rem" },
    border: "1px solid transparent",
    borderRadius: "0.375rem",
    boxShadow: {
      default: "none",
      "[aria-current=page]": "0 1px 2px rgb(0 0 0 / 0.05)",
    },
    color: {
      default: "color-mix(in oklab, var(--muted-foreground) 72%, transparent)",
      ":hover": "var(--muted-foreground)",
      "[aria-current=page]": "var(--foreground)",
    },
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    justifyContent: "center",
    outline: "2px solid transparent",
    paddingInline: "calc(0.5rem - 1px)",
    position: "relative",
    textDecoration: "none",
    transition: "outline-color 150ms",
    userSelect: "none",
    whiteSpace: "nowrap",
    ":focus-visible": { outlineColor: "var(--ring)" },
  },
})
