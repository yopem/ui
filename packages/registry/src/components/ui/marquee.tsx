"use client"

import type { StyleXComponentProps } from "@registry/lib/stylex"
import type { ComponentPropsWithRef } from "react"

import { mergeStylexProps, stylexProps } from "@registry/lib/stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"
import { useState } from "react"

const scroll = stylex.keyframes({
  to: { transform: "translateX(-50%)" },
})

const styles = stylex.create({
  root: { display: "grid", gap: "0.5rem" },
  viewport: {
    inlineSize: "100%",
    overflowX: "hidden",
    "@media (prefers-reduced-motion: reduce)": { overflowX: "auto" },
  },
  track: {
    animationDuration: "30s",
    animationIterationCount: "infinite",
    animationName: scroll,
    animationTimingFunction: "linear",
    display: "flex",
    inlineSize: "max-content",
    "[data-paused]": { animationPlayState: "paused" },
    ":focus-within": { animationPlayState: "paused" },
    "@media (prefers-reduced-motion: reduce)": { animationName: "none" },
  },
  group: {
    alignItems: "center",
    columnGap: "2rem",
    display: "flex",
    flex: "none",
    paddingInlineEnd: "2rem",
  },
  pauseButton: {
    backgroundColor: tokens["--background"],
    borderColor: tokens["--input"],
    borderRadius: tokens["--radius-sm"],
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens["--foreground"],
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.875rem",
    minBlockSize: "2rem",
    paddingInline: "0.5rem",
    ":focus-visible": {
      outlineColor: tokens["--ring"],
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    "@media (pointer: coarse)": { minBlockSize: "2.75rem" },
    "@media (prefers-reduced-motion: reduce)": { display: "none" },
  },
})

export type MarqueeProps = StyleXComponentProps<ComponentPropsWithRef<"div">>

export function Marquee({
  xstyle: consumerXstyle,
  className,
  children,
  ...props
}: MarqueeProps) {
  const [paused, setPaused] = useState(false)

  return (
    <div
      data-slot="marquee"
      {...mergeStylexProps(
        stylexProps(className, styles.root, consumerXstyle),
        props,
      )}
    >
      <div data-slot="marquee-viewport" {...stylex.props(styles.viewport)}>
        <div
          data-paused={paused ? "" : undefined}
          data-slot="marquee-track"
          {...stylex.props(styles.track)}
        >
          <div data-slot="marquee-group" {...stylex.props(styles.group)}>
            {children}
          </div>
          <div
            aria-hidden="true"
            data-slot="marquee-group"
            inert
            {...stylex.props(styles.group)}
          >
            {children}
          </div>
        </div>
      </div>
      <button
        aria-label={
          paused ? "Resume scrolling content" : "Pause scrolling content"
        }
        data-slot="marquee-pause"
        onClick={() => setPaused((current) => !current)}
        type="button"
        {...stylex.props(styles.pauseButton)}
      >
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  )
}
