import * as stylex from "@stylexjs/stylex"

import { Separator } from "@/components/ui/stylex/separator"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <div {...stylex.props(demoStyles.demo2)}>
        <h4 {...stylex.props(demoStyles.demo3)}>coss ui</h4>
        <p {...stylex.props(demoStyles.demo4)}>
          Unstyled, accessible primitives for fast product UI and design
          systems.
        </p>
      </div>
      <Separator {...stylex.props(demoStyles.demo5)} />
      <div {...stylex.props(demoStyles.demo6)}>
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
        <Separator orientation="vertical" />
        <div>Releases</div>
      </div>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    maxInlineSize: "calc(0.25rem * 72)",
  },
  demo2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  demo3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  demo4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  demo5: {
    marginBlock: "calc(0.25rem * 4)",
  },
  demo6: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
