"use client"

import type { StyleXProps } from "@registry/lib/stylex"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  root: {
    blockSize: "100%",
    inlineSize: "100%",
    minBlockSize: 0,
  },
  viewport: {
    blockSize: "100%",
    borderRadius: "inherit",
    outline: "none",
    transitionProperty: "box-shadow",
    ":focus-visible": {
      boxShadow: `0 0 0 2px ${tokens["--ring"]}, 0 0 0 3px ${tokens["--background"]}`,
    },
  },
  overscrollContain: {
    "[data-has-overflow-x]": { overscrollBehaviorInline: "contain" },
    "[data-has-overflow-y]": { overscrollBehaviorBlock: "contain" },
  },
  scrollFade: {
    maskComposite: "intersect",
    maskImage:
      "linear-gradient(to bottom, transparent 0, #000 min(var(--fade-size),var(--scroll-area-overflow-y-start)), #000 calc(100% - min(var(--fade-size),var(--scroll-area-overflow-y-end))), transparent 100%), linear-gradient(to right, transparent 0, #000 min(var(--fade-size),var(--scroll-area-overflow-x-start)), #000 calc(100% - min(var(--fade-size),var(--scroll-area-overflow-x-end))), transparent 100%)",
    "--fade-size": "1.5rem",
  },
  scrollbarGutter: {
    "[data-has-overflow-x]": { paddingBlockEnd: "0.625rem" },
    "[data-has-overflow-y]": { paddingInlineEnd: "0.625rem" },
  },
  fill: { blockSize: "100%", inlineSize: "100%" },
  clampContentMinWidth: { minInlineSize: 0 },
  scrollbar: {
    display: "flex",
    margin: "0.25rem",
    opacity: 0,
    transitionDelay: "300ms",
    transitionProperty: "opacity",
    "[data-hovering]": {
      opacity: 1,
      transitionDelay: "0ms",
      transitionDuration: "100ms",
    },
    "[data-scrolling]": {
      opacity: 1,
      transitionDelay: "0ms",
      transitionDuration: "100ms",
    },
    "[data-orientation=horizontal]": {
      blockSize: "0.375rem",
      flexDirection: "column",
    },
    "[data-orientation=vertical]": { inlineSize: "0.375rem" },
  },
  thumb: {
    backgroundColor:
      "color-mix(in oklab, var(--foreground, currentColor) 20%, transparent)",
    borderRadius: "9999px",
    flex: 1,
    position: "relative",
  },
})

export function ScrollArea({
  xstyle,
  className,
  children,
  scrollFade = false,
  scrollbarGutter = false,
  fill = false,
  clampContentMinWidth = true,
  overscrollContain = false,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  scrollFade?: boolean
  scrollbarGutter?: boolean
  fill?: boolean
  clampContentMinWidth?: boolean
  overscrollContain?: boolean
} & StyleXProps) {
  const label = props["aria-label"] ?? "Scrollable content"
  return (
    <ScrollAreaPrimitive.Root
      {...stylexProps(className, styles.root, xstyle)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        {...stylex.props(
          styles.viewport,
          overscrollContain && styles.overscrollContain,
          scrollFade && styles.scrollFade,
          scrollbarGutter && styles.scrollbarGutter,
        )}
        aria-label={label}
        data-slot="scroll-area-viewport"
        tabIndex={0}
      >
        <ScrollAreaPrimitive.Content
          {...stylex.props(
            fill && styles.fill,
            clampContentMinWidth && styles.clampContentMinWidth,
          )}
          data-slot="scroll-area-content"
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar orientation="vertical" />
      <ScrollBar orientation="horizontal" />
      <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
    </ScrollAreaPrimitive.Root>
  )
}

export function ScrollBar({
  xstyle,
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props & StyleXProps) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      {...stylexProps(className, styles.scrollbar, xstyle)}
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        {...stylex.props(styles.thumb)}
        data-slot="scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollAreaPrimitive }
