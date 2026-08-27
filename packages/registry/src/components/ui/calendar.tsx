"use client"

import type * as React from "react"

import { DayPicker } from "@daypicker/react"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { clsx } from "clsx"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
} from "lucide-react"

const styles = stylex.create({
  root: {
    inlineSize: "fit-content",
    "--cell-size": {
      default: "2.5rem",
      "@media (min-width: 640px)": "2.25rem",
    },
  },
  button: {
    alignItems: "center",
    blockSize: "var(--cell-size)",
    borderRadius: tokens.radiusLarge,
    color: tokens.foreground,
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: "var(--cell-size)",
    justifyContent: "center",
    position: "relative",
    ":disabled": { opacity: 0.64, pointerEvents: "none" },
    ":hover": { backgroundColor: tokens.accent },
  },
  captionLabel: {
    alignItems: "center",
    blockSize: "100%",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    fontWeight: 500,
    gap: "0.5rem",
  },
  day: {
    blockSize: "var(--cell-size)",
    fontSize: "0.875rem",
    inlineSize: "var(--cell-size)",
    paddingBlock: 1,
  },
  dayButton: {
    outline: "none",
    ":focus-visible": {
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 50%, transparent)`,
      zIndex: 1,
    },
  },
  dropdown: {
    backgroundColor: tokens.popover,
    inset: 0,
    opacity: 0,
    position: "absolute",
  },
  dropdownRoot: {
    blockSize: { default: "2.25rem", "@media (min-width: 640px)": "2rem" },
    borderColor: tokens.input,
    borderRadius: tokens.radiusLarge,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    paddingInline: "calc(0.75rem - 1px)",
    position: "relative",
    ":focus-within": {
      borderColor: tokens.ring,
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 50%, transparent)`,
    },
  },
  dropdowns: {
    alignItems: "center",
    blockSize: "var(--cell-size)",
    display: "flex",
    fontSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    gap: "0.375rem",
    inlineSize: "100%",
    justifyContent: "center",
  },
  hidden: { visibility: "hidden" },
  month: { inlineSize: "100%" },
  monthCaption: {
    alignItems: "center",
    blockSize: "var(--cell-size)",
    display: "flex",
    justifyContent: "center",
    marginBlockEnd: "0.25rem",
    marginInline: "var(--cell-size)",
    paddingInline: "0.25rem",
    position: "relative",
    zIndex: 2,
  },
  months: {
    display: "flex",
    flexDirection: { default: "column", "@media (min-width: 640px)": "row" },
    gap: "0.5rem",
    position: "relative",
  },
  nav: {
    display: "flex",
    inlineSize: "100%",
    insetBlockStart: 0,
    justifyContent: "space-between",
    position: "absolute",
    zIndex: 1,
  },
  outside: { color: tokens.mutedForeground },
  weekCell: {
    blockSize: "var(--cell-size)",
    color:
      "color-mix(in oklab, var(--muted-foreground, currentColor) 72%, transparent)",
    fontSize: "0.75rem",
    fontWeight: 500,
    inlineSize: "var(--cell-size)",
    padding: 0,
  },
})

const buttonClassNames = stylex.props(styles.button).className

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  mode = "single",
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = {
    button_next: buttonClassNames,
    button_previous: buttonClassNames,
    caption_label: stylex.props(styles.captionLabel).className,
    day: stylex.props(styles.day).className,
    day_button: stylex.props(styles.button, styles.dayButton).className,
    dropdown: stylex.props(styles.dropdown).className,
    dropdown_root: stylex.props(styles.dropdownRoot).className,
    dropdowns: stylex.props(styles.dropdowns).className,
    hidden: stylex.props(styles.hidden).className,
    month: stylex.props(styles.month).className,
    month_caption: stylex.props(styles.monthCaption).className,
    months: stylex.props(styles.months).className,
    nav: stylex.props(styles.nav).className,
    outside: stylex.props(styles.outside).className,
    range_end: "range-end",
    range_middle: "range-middle",
    range_start: "range-start",
    today: "calendar-today",
    week_number: stylex.props(styles.weekCell).className,
    weekday: stylex.props(styles.weekCell).className,
  }

  const mergedClassNames = Object.keys(defaultClassNames).reduce(
    (result, key) => {
      const name = key as keyof typeof defaultClassNames
      result[name] = clsx(defaultClassNames[name], classNames?.[name])
      return result
    },
    { ...defaultClassNames },
  )

  const defaultComponents = {
    Chevron: ({
      className: iconClassName,
      orientation,
      ...iconProps
    }: {
      className?: string
      orientation?: "left" | "right" | "up" | "down"
    }) => {
      if (orientation === "left") {
        return (
          <ChevronLeftIcon
            className={clsx(iconClassName, "yopem-calendar-direction-icon")}
            {...iconProps}
            aria-hidden="true"
          />
        )
      }
      if (orientation === "right") {
        return (
          <ChevronRightIcon
            className={clsx(iconClassName, "yopem-calendar-direction-icon")}
            {...iconProps}
            aria-hidden="true"
          />
        )
      }
      return (
        <ChevronsUpDownIcon
          className={iconClassName}
          {...iconProps}
          aria-hidden="true"
        />
      )
    },
  }

  const dayPickerProps = {
    ...stylexProps(className, styles.root),
    classNames: mergedClassNames,
    components: { ...defaultComponents, ...userComponents },
    "data-slot": "calendar",
    formatters: {
      formatMonthDropdown: (date: Date) =>
        date.toLocaleString("default", { month: "short" }),
    } as React.ComponentProps<typeof DayPicker>["formatters"],
    mode,
    showOutsideDays,
    ...props,
  }

  return (
    <DayPicker
      {...(dayPickerProps as React.ComponentProps<typeof DayPicker>)}
    />
  )
}
