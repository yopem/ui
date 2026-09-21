"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"

import { Meter as MeterPrimitive } from "@base-ui/react/meter"
import { splitStyleProps } from "@registry/lib/style-props"
import { mergeStyleProps, stylexProps } from "@registry/lib/stylex"
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
}: StyleComponentProps<MeterPrimitive.Root.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <MeterPrimitive.Root
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
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
}: StyleComponentProps<MeterPrimitive.Label.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <MeterPrimitive.Label
      data-slot="meter-label"
      {...mergeStyleProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}
export function MeterTrack({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<MeterPrimitive.Track.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <MeterPrimitive.Track
      data-slot="meter-track"
      {...mergeStyleProps(stylexProps(className, styles.track, xstyle), props)}
    />
  )
}
export function MeterIndicator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<MeterPrimitive.Indicator.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <MeterPrimitive.Indicator
      data-slot="meter-indicator"
      {...mergeStyleProps(
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
}: StyleComponentProps<MeterPrimitive.Value.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <MeterPrimitive.Value
      data-slot="meter-value"
      {...mergeStyleProps(stylexProps(className, styles.value, xstyle), props)}
    />
  )
}
export { MeterPrimitive }
