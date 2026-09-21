"use client"

import type { StyleComponentProps } from "@registry/lib/style-props"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
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
  xstyle: consumerXstyle,
  className,
  children,
  ...restProps
}: StyleComponentProps<ProgressPrimitive.Root.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      {...mergeStyleProps(stylexProps(className, styles.root, xstyle), props)}
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
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<ProgressPrimitive.Label.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <ProgressPrimitive.Label
      data-slot="progress-label"
      {...mergeStyleProps(stylexProps(className, styles.label, xstyle), props)}
    />
  )
}
export function ProgressTrack({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<ProgressPrimitive.Track.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <ProgressPrimitive.Track
      data-slot="progress-track"
      {...mergeStyleProps(stylexProps(className, styles.track, xstyle), props)}
    />
  )
}
export function ProgressIndicator({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<ProgressPrimitive.Indicator.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      {...mergeStyleProps(
        stylexProps(className, styles.indicator, xstyle),
        props,
      )}
    />
  )
}
export function ProgressValue({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleComponentProps<ProgressPrimitive.Value.Props>) {
  const { domProps: props, xstyle: styleProps } = splitStyleProps(restProps)
  const xstyle = [styleProps, consumerXstyle]

  return (
    <ProgressPrimitive.Value
      data-slot="progress-value"
      {...mergeStyleProps(stylexProps(className, styles.value, xstyle), props)}
    />
  )
}
export { ProgressPrimitive }
