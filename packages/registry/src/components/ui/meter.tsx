"use client"

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
  label: { color: tokens.foreground, fontSize: "0.875rem", fontWeight: 500 },
  track: {
    backgroundColor: tokens.input,
    blockSize: "0.5rem",
    display: "block",
    inlineSize: "100%",
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: tokens.primary,
    transitionDuration: "500ms",
    transitionProperty: "all",
  },
  value: {
    color: tokens.foreground,
    fontSize: "0.875rem",
    fontVariantNumeric: "tabular-nums",
  },
})

export function Meter({
  className,
  children,
  ...props
}: MeterPrimitive.Root.Props) {
  return (
    <MeterPrimitive.Root {...stylexProps(className, styles.root)} {...props}>
      {children ?? (
        <MeterTrack>
          <MeterIndicator />
        </MeterTrack>
      )}
    </MeterPrimitive.Root>
  )
}
export function MeterLabel({
  className,
  ...props
}: MeterPrimitive.Label.Props) {
  return (
    <MeterPrimitive.Label
      {...stylexProps(className, styles.label)}
      data-slot="meter-label"
      {...props}
    />
  )
}
export function MeterTrack({
  className,
  ...props
}: MeterPrimitive.Track.Props) {
  return (
    <MeterPrimitive.Track
      {...stylexProps(className, styles.track)}
      data-slot="meter-track"
      {...props}
    />
  )
}
export function MeterIndicator({
  className,
  ...props
}: MeterPrimitive.Indicator.Props) {
  return (
    <MeterPrimitive.Indicator
      {...stylexProps(className, styles.indicator)}
      data-slot="meter-indicator"
      {...props}
    />
  )
}
export function MeterValue({
  className,
  ...props
}: MeterPrimitive.Value.Props) {
  return (
    <MeterPrimitive.Value
      {...stylexProps(className, styles.value)}
      data-slot="meter-value"
      {...props}
    />
  )
}
export { MeterPrimitive }
