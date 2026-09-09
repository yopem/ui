"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    inlineSize: "100%",
  },
  label: { fontSize: "0.875rem", fontWeight: 500 },
  track: {
    backgroundColor: tokens["--input"],
    blockSize: "0.375rem",
    borderRadius: "9999px",
    display: "block",
    inlineSize: "100%",
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: tokens["--primary"],
    transitionDuration: "500ms",
    transitionProperty: "all",
  },
  value: { fontSize: "0.875rem", fontVariantNumeric: "tabular-nums" },
})

export function Progress({
  xstyle,
  className,
  children,
  ...props
}: ProgressPrimitive.Root.Props & StyleXProps) {
  return (
    <ProgressPrimitive.Root
      {...stylexProps(className, styles.root, xstyle)}
      data-slot="progress"
      {...props}
    >
      {children ?? (
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  )
}
export function ProgressLabel({
  xstyle,
  className,
  ...props
}: ProgressPrimitive.Label.Props & StyleXProps) {
  return (
    <ProgressPrimitive.Label
      {...stylexProps(className, styles.label, xstyle)}
      data-slot="progress-label"
      {...props}
    />
  )
}
export function ProgressTrack({
  xstyle,
  className,
  ...props
}: ProgressPrimitive.Track.Props & StyleXProps) {
  return (
    <ProgressPrimitive.Track
      {...stylexProps(className, styles.track, xstyle)}
      data-slot="progress-track"
      {...props}
    />
  )
}
export function ProgressIndicator({
  xstyle,
  className,
  ...props
}: ProgressPrimitive.Indicator.Props & StyleXProps) {
  return (
    <ProgressPrimitive.Indicator
      {...stylexProps(className, styles.indicator, xstyle)}
      data-slot="progress-indicator"
      {...props}
    />
  )
}
export function ProgressValue({
  xstyle,
  className,
  ...props
}: ProgressPrimitive.Value.Props & StyleXProps) {
  return (
    <ProgressPrimitive.Value
      {...stylexProps(className, styles.value, xstyle)}
      data-slot="progress-value"
      {...props}
    />
  )
}
export { ProgressPrimitive }
