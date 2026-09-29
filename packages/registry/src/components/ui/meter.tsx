"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Meter as MeterPrimitive } from "@base-ui/react/meter"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
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
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleXComponentProps<MeterPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MeterPrimitive.Root
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MeterPrimitive.Label.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MeterPrimitive.Label
      data-slot="meter-label"
      {...mergeStylexProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}

export function MeterTrack({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MeterPrimitive.Track.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MeterPrimitive.Track
      data-slot="meter-track"
      {...mergeStylexProps(stylexProps(className, styles.track, xstyle), props)}
    />
  )
}

export function MeterIndicator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MeterPrimitive.Indicator.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MeterPrimitive.Indicator
      data-slot="meter-indicator"
      {...mergeStylexProps(
        stylexProps(className, styles.indicator, xstyle),
        props,
      )}
    />
  )
}

export function MeterValue({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<MeterPrimitive.Value.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <MeterPrimitive.Value
      data-slot="meter-value"
      {...mergeStylexProps(stylexProps(className, styles.value, xstyle), props)}
    />
  )
}

export { MeterPrimitive }
