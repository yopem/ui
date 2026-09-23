"use client"

import * as stylex from "@stylexjs/stylex"

import {
  RadioGroupPrimitive,
  RadioPrimitive,
} from "@/components/ui/radio-group"

export default function Example() {
  return (
    <RadioGroupPrimitive
      aria-label="Billing period"
      {...stylex.props(styles.root)}
      defaultValue="monthly"
    >
      <RadioPrimitive.Root
        {...stylex.props(styles.item, styles.medium)}
        value="monthly"
      >
        Monthly
      </RadioPrimitive.Root>
      <RadioPrimitive.Root
        {...stylex.props(styles.item, styles.medium)}
        value="yearly"
      >
        Yearly
      </RadioPrimitive.Root>
    </RadioGroupPrimitive>
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
      "[data-checked]": "var(--background)",
    },
    border: "1px solid transparent",
    borderRadius: "0.375rem",
    boxShadow: {
      default: "none",
      "[data-checked]": "0 1px 2px rgb(0 0 0 / 0.05)",
    },
    color: {
      default: "var(--muted-foreground)",
      ":hover": "var(--muted-foreground)",
      "[data-checked]": "var(--foreground)",
    },
    cursor: "pointer",
    display: "inline-flex",
    flexGrow: 1,
    flexShrink: 0,
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    justifyContent: "center",
    outline: "2px solid transparent",
    position: "relative",
    transition: "outline-color 150ms",
    userSelect: "none",
    whiteSpace: "nowrap",
    ":focus-visible": { outlineColor: "var(--ring)" },
  },
  medium: {
    blockSize: { default: "2.125rem", "@media (min-width: 640px)": "1.875rem" },
    paddingInline: "calc(0.625rem - 1px)",
  },
})
