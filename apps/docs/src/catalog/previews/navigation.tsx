import { Box } from "@registry/components/ui/box"
import { Flex } from "@registry/components/ui/flex"
import { Link } from "@registry/components/ui/link"
import * as stylex from "@stylexjs/stylex"
const styles = stylex.create({
  flex: {
    alignItems: "center",
    backgroundColor: "var(--muted)",
    borderRadius: "0.5rem",
    gap: "0.125rem",
    inlineSize: "fit-content",
    justifyContent: "center",
    paddingBlock: "0.125rem",
    paddingInline: "0.125rem",
    position: "relative",
    zIndex: 0,
  },
  link: {
    alignItems: "center",
    backgroundColor: "var(--background)",
    blockSize: { default: "2.125rem", "@media (min-width: 768px)": "1.875rem" },
    borderColor: "transparent",
    borderRadius: "0.375rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
    color: "var(--foreground)",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: { default: "1rem", "@media (min-width: 768px)": "0.875rem" },
    fontWeight: 500,
    justifyContent: "center",
    outline: "2px solid transparent",
    paddingInline: "calc(0.625rem - 1px)",
    position: "relative",
    textDecoration: "none",
    transition: "outline-color 150ms",
    userSelect: "none",
    whiteSpace: "nowrap",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": "var(--ring)",
    },
  },
  link2: {
    alignItems: "center",
    backgroundColor: "transparent",
    blockSize: { default: "2.125rem", "@media (min-width: 768px)": "1.875rem" },
    borderColor: "transparent",
    borderRadius: "0.375rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "none",
    color: {
      default: "var(--muted-foreground)",
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        "var(--muted-foreground)",
    },
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: { default: "1rem", "@media (min-width: 768px)": "0.875rem" },
    fontWeight: 500,
    justifyContent: "center",
    outline: "2px solid transparent",
    paddingInline: "calc(0.625rem - 1px)",
    position: "relative",
    textDecoration: "none",
    transition: "outline-color 150ms",
    userSelect: "none",
    whiteSpace: "nowrap",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": "var(--ring)",
    },
  },
  link3: {
    alignItems: "center",
    backgroundColor: "transparent",
    blockSize: { default: "2.125rem", "@media (min-width: 768px)": "1.875rem" },
    borderColor: "transparent",
    borderRadius: "0.375rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "none",
    color: {
      default: "var(--muted-foreground)",
      ":is(:hover, [data-hover]):not(:disabled, [disabled], [aria-disabled=true], [data-disabled])":
        "var(--muted-foreground)",
    },
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: 0,
    fontSize: { default: "1rem", "@media (min-width: 768px)": "0.875rem" },
    fontWeight: 500,
    justifyContent: "center",
    outline: "2px solid transparent",
    paddingInline: "calc(0.625rem - 1px)",
    position: "relative",
    textDecoration: "none",
    transition: "outline-color 150ms",
    userSelect: "none",
    whiteSpace: "nowrap",
    outlineColor: {
      ":is(:focus-visible, [data-focus-visible])": "var(--ring)",
    },
  },
})
export function Preview() {
  return (
    <Box as="nav" aria-label="Project sections">
      <Flex xstyle={styles.flex}>
        <Link aria-current="page" xstyle={styles.link} href="#overview">
          Overview
        </Link>
        <Link xstyle={styles.link2} href="#activity">
          Activity
        </Link>
        <Link xstyle={styles.link3} href="#settings">
          Settings
        </Link>
      </Flex>
    </Box>
  )
}
