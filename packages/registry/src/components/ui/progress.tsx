"use client"

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
    backgroundColor: tokens.input,
    blockSize: "0.375rem",
    borderRadius: "9999px",
    display: "block",
    inlineSize: "100%",
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: tokens.primary,
    transitionDuration: "500ms",
    transitionProperty: "all",
  },
  value: { fontSize: "0.875rem", fontVariantNumeric: "tabular-nums" },
})

export function Progress({
  className,
  children,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      {...stylexProps(className, styles.root)}
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
  className,
  ...props
}: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      {...stylexProps(className, styles.label)}
      data-slot="progress-label"
      {...props}
    />
  )
}
export function ProgressTrack({
  className,
  ...props
}: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      {...stylexProps(className, styles.track)}
      data-slot="progress-track"
      {...props}
    />
  )
}
export function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      {...stylexProps(className, styles.indicator)}
      data-slot="progress-indicator"
      {...props}
    />
  )
}
export function ProgressValue({
  className,
  ...props
}: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      {...stylexProps(className, styles.value)}
      data-slot="progress-value"
      {...props}
    />
  )
}
export { ProgressPrimitive }
