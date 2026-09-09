"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { Meter as MeterPrimitive } from "@base-ui/react/meter"
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
  label: {
    color: tokens["--foreground"],
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  track: {
    backgroundColor: tokens["--input"],
    blockSize: "0.5rem",
    display: "block",
    inlineSize: "100%",
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: tokens["--primary"],
    transitionDuration: "500ms",
    transitionProperty: "all",
  },
  value: {
    color: tokens["--foreground"],
    fontSize: "0.875rem",
    fontVariantNumeric: "tabular-nums",
  },
})

export function Meter({
  xstyle,
  className,
  children,
  ...props
}: MeterPrimitive.Root.Props & StyleXProps) {
  return (
    <MeterPrimitive.Root
      {...stylexProps(className, styles.root, xstyle)}
      {...props}
    >
      {children ?? (
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      )}
    </MeterPrimitive.Root>
  )
}
export function MeterLabel({
  xstyle,
  className,
  ...props
}: MeterPrimitive.Label.Props & StyleXProps) {
  return (
    <MeterPrimitive.Label
      {...stylexProps(className, styles.label, xstyle)}
      data-slot="meter-label"
      {...props}
    />
  )
}
export function MeterTrack({
  xstyle,
  className,
  ...props
}: MeterPrimitive.Track.Props & StyleXProps) {
  return (
    <MeterPrimitive.Track
      {...stylexProps(className, styles.track, xstyle)}
      data-slot="meter-track"
      {...props}
    />
  )
}
export function MeterIndicator({
  xstyle,
  className,
  ...props
}: MeterPrimitive.Indicator.Props & StyleXProps) {
  return (
    <MeterPrimitive.Indicator
      {...stylexProps(className, styles.indicator, xstyle)}
      data-slot="meter-indicator"
      {...props}
    />
  )
}
export function MeterValue({
  xstyle,
  className,
  ...props
}: MeterPrimitive.Value.Props & StyleXProps) {
  return (
    <MeterPrimitive.Value
      {...stylexProps(className, styles.value, xstyle)}
      data-slot="meter-value"
      {...props}
    />
  )
}
export { MeterPrimitive }
