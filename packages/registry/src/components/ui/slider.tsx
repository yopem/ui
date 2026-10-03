"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { themeMarker, tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useMemo } from "react"

const styles = stylex.create({
  root: {
    inlineSize: {
      default: null,
      "[data-orientation=horizontal]": "100%",
    },
  },
  control: {
    blockSize: {
      default: null,
      "[data-orientation=vertical]": "100%",
    },
    display: "flex",
    flexDirection: {
      default: "row",
      "[data-orientation=vertical]": "column",
    },
    inlineSize: {
      default: null,
      "[data-orientation=horizontal]": "100%",
    },
    minBlockSize: {
      default: null,
      "[data-orientation=vertical]": "11rem",
    },
    minInlineSize: {
      default: null,
      "[data-orientation=horizontal]": "11rem",
    },
    opacity: {
      default: 1,
      "[data-disabled]": 0.64,
    },
    pointerEvents: {
      default: "auto",
      "[data-disabled]": "none",
    },
    touchAction: "none",
    userSelect: "none",
  },
  track: {
    blockSize: {
      default: "0.25rem",
      "[data-orientation=vertical]": "100%",
    },
    flexGrow: 1,
    inlineSize: {
      default: "100%",
      "[data-orientation=vertical]": "0.25rem",
    },
    position: "relative",
    userSelect: "none",
    "::before": {
      backgroundColor: tokens["--input"],
      borderRadius: "9999px",
      content: '""',
      position: "absolute",
      insetBlock: {
        default: null,
        '[data-orientation="horizontal"]': 0,
        '[data-orientation="vertical"]': "0.125rem",
      },
      insetInline: {
        default: null,
        '[data-orientation="horizontal"]': "0.125rem",
        '[data-orientation="vertical"]': 0,
      },
    },
  },
  indicator: {
    backgroundColor: tokens["--primary"],
    borderRadius: "9999px",
    userSelect: "none",
  },
  thumb: {
    backgroundClip: "padding-box",
    backgroundColor: "#fff",
    blockSize: {
      default: "1.25rem",
      "@media (min-width: 640px)": "1rem",
    },
    borderColor: {
      default: tokens["--input"],
      [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
        tokens["--background"],
    },
    borderRadius: "9999px",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 1px 2px color-mix(in oklab, #000 5%, transparent)",
    display: "block",
    flexShrink: 0,
    inlineSize: {
      default: "1.25rem",
      "@media (min-width: 640px)": "1rem",
    },
    outline: "none",
    scale: {
      default: 1,
      "[data-dragging]": 1.2,
    },
    transitionProperty: "box-shadow, scale",
    userSelect: "none",
    ":focus-visible": {
      boxShadow: `0 0 0 3px color-mix(in oklab, var(--ring, currentColor) 24%, transparent)`,
    },
  },
  value: {
    display: "flex",
    fontSize: "0.875rem",
    justifyContent: "end",
  },
})

export function Slider({
  xstyle: consumerXstyle,
  className,
  children,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...restProps
}: StyleXComponentProps<SliderPrimitive.Root.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  const values = useMemo(() => {
    if (value !== undefined) return Array.isArray(value) ? value : [value]

    if (defaultValue !== undefined)
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]

    return [min]
  }, [value, defaultValue, min])

  const label = props["aria-label"]

  return (
    <SliderPrimitive.Root
      defaultValue={defaultValue}
      max={max}
      min={min}
      thumbAlignment="edge"
      value={value}
      {...mergeStylexProps(stylexProps(className, styles.root, xstyle), props)}
    >
      {children}
      <SliderPrimitive.Control
        {...stylex.props(styles.control)}
        data-slot="slider-control"
      >
        <SliderPrimitive.Track
          {...stylex.props(styles.track)}
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator
            {...stylex.props(styles.indicator)}
            data-slot="slider-indicator"
          />
          {Array.from({ length: values.length }, (_, index) => (
            <SliderPrimitive.Thumb
              key={String(index)}
              {...stylex.props(styles.thumb)}
              aria-label={
                label && values.length > 1 ? `${label} ${index + 1}` : label
              }
              data-slot="slider-thumb"
              index={index}
            />
          ))}
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export function SliderValue({
  xstyle: consumerXstyle,
  className,
  ...restProps
}: StyleXComponentProps<SliderPrimitive.Value.Props>) {
  const props = restProps
  const xstyle = consumerXstyle

  return (
    <SliderPrimitive.Value
      data-slot="slider-value"
      {...mergeStylexProps(stylexProps(className, styles.value, xstyle), props)}
    />
  )
}

export { SliderPrimitive }
