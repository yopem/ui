import * as stylex from "@stylexjs/stylex"

import { ScrollArea } from "@/components/ui/stylex/scroll-area"

export default function Particle() {
  return (
    <ScrollArea {...stylex.props(demoStyles.demo1)} scrollbarGutter>
      <div {...stylex.props(demoStyles.demo2)}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div {...stylex.props(demoStyles.demo3)} key={String(i)}>
            <span {...stylex.props(demoStyles.demo4)}>Item {i + 1}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

const demoStyles = stylex.create({
  demo1: {
    maxInlineSize: "calc(0.25rem * 96)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  demo2: {
    display: "flex",
    inlineSize: "max-content",
    gap: "calc(0.25rem * 4)",
    padding: "calc(0.25rem * 4)",
  },
  demo3: {
    display: "flex",
    blockSize: "calc(0.25rem * 20)",
    inlineSize: "calc(0.25rem * 32)",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "var(--muted)",
  },
  demo4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
