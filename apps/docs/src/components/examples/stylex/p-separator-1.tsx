import * as stylex from "@stylexjs/stylex"

import { Separator } from "@/components/ui/stylex/separator"

export default function Example() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <div {...stylex.props(exampleStyles.example2)}>
        <h2 {...stylex.props(exampleStyles.example3)}>coss ui</h2>
        <p {...stylex.props(exampleStyles.example4)}>
          Unstyled, accessible primitives for fast product UI and design
          systems.
        </p>
      </div>
      <Separator {...stylex.props(exampleStyles.example5)} />
      <div {...stylex.props(exampleStyles.example6)}>
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

const exampleStyles = stylex.create({
  example1: {
    maxInlineSize: "calc(0.25rem * 72)",
  },
  example2: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  example3: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example5: {
    marginBlock: "calc(0.25rem * 4)",
  },
  example6: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 4)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
})
