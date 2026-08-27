"use client"

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { stylexProps } from "@registry/lib/stylex"
import { themeMarker } from "@registry/styles/markers.stylex"
import { tokens } from "@registry/styles/tokens.stylex"
import * as stylex from "@stylexjs/stylex"

const styles = stylex.create({
  card: {
    backgroundClip: "padding-box",
    backgroundColor: tokens.card,
    borderColor: tokens.border,
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "var(--button-outline-shadow)",
    color: tokens.cardForeground,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    "::before": {
      borderRadius: "calc(1rem - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  frame: {
    backgroundColor: tokens.card,
    borderColor: tokens.border,
    borderRadius: "1rem",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "var(--button-outline-shadow)",
    color: tokens.cardForeground,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    "::before": {
      backgroundColor:
        "color-mix(in oklab, var(--muted, transparent) 72%, transparent)",
      borderRadius: "calc(1rem - 1px)",
      boxShadow: {
        default: "var(--button-outline-inset-shadow)",
        [stylex.when.ancestor('[data-theme="dark"]', themeMarker)]:
          "var(--button-outline-inset-shadow-dark)",
      },
      content: '""',
      inset: 0,
      pointerEvents: "none",
      position: "absolute",
    },
  },
  frameHeader: {
    alignItems: "start",
    columnGap: "1rem",
    display: "grid",
    gridAutoRows: "min-content",
    gridTemplateRows: "auto auto",
    paddingBlock: "1rem",
    paddingInline: "1.5rem",
    position: "relative",
  },
  frameTitle: { alignSelf: "center", fontSize: "0.875rem", fontWeight: 600 },
  frameDescription: {
    alignSelf: "center",
    color: tokens.mutedForeground,
    fontSize: "0.875rem",
  },
  frameAction: {
    alignSelf: "center",
    display: "inline-flex",
    gridColumnStart: "2",
    justifySelf: "end",
  },
  frameFooter: { paddingBlock: "1rem", paddingInline: "1.5rem" },
  header: {
    alignItems: "start",
    display: "grid",
    gap: "0.375rem",
    gridAutoRows: "min-content",
    gridTemplateRows: "auto auto",
    padding: "1.5rem",
  },
  title: {
    fontFamily: tokens.fontHeading,
    fontSize: "1.125rem",
    fontWeight: 600,
    lineHeight: 1,
  },
  description: { color: tokens.mutedForeground, fontSize: "0.875rem" },
  action: {
    alignSelf: "start",
    display: "inline-flex",
    gridColumnStart: "2",
    gridRow: "1 / span 2",
    justifySelf: "end",
  },
  panel: { flex: 1, padding: "1.5rem" },
  footer: { alignItems: "center", display: "flex", padding: "1.5rem" },
})

function staticClassName(
  className: useRender.ComponentProps<"div">["className"],
) {
  return typeof className === "string" ? className : undefined
}

export function Card({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.card),
    "data-slot": "card",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFrame({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.frame),
    "data-slot": "card-frame",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFrameHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.frameHeader),
    "data-slot": "card-frame-header",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFrameTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.frameTitle),
    "data-slot": "card-frame-title",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFrameDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.frameDescription),
    "data-slot": "card-frame-description",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFrameAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.frameAction),
    "data-slot": "card-frame-action",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFrameFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.frameFooter),
    "data-slot": "card-frame-footer",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardHeader({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.header),
    "data-slot": "card-header",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.title),
    "data-slot": "card-title",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.description),
    "data-slot": "card-description",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.action),
    "data-slot": "card-action",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardPanel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.panel),
    "data-slot": "card-panel",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}
export function CardFooter({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  const defaultProps = {
    ...stylexProps(staticClassName(className), styles.footer),
    "data-slot": "card-footer",
  }
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(defaultProps, props),
    render,
  })
}

export { CardPanel as CardContent }
