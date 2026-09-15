import * as stylex from "@stylexjs/stylex"

import { ScrollArea } from "@/components/ui/stylex/scroll-area"

export default function Particle() {
  return (
    <ScrollArea {...stylex.props(exampleStyles.example1)}>
      <div {...stylex.props(exampleStyles.example2)}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div {...stylex.props(exampleStyles.example3)} key={String(i)}>
            <span {...stylex.props(exampleStyles.example4)}>Item {i + 1}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

const exampleStyles = stylex.create({
  example1: {
    maxInlineSize: "calc(0.25rem * 96)",
    borderRadius: "var(--radius)",
    borderStyle: "solid",
    borderWidth: "1px",
  },
  example2: {
    display: "flex",
    inlineSize: "max-content",
    gap: "calc(0.25rem * 4)",
    padding: "calc(0.25rem * 4)",
  },
  example3: {
    display: "flex",
    blockSize: "calc(0.25rem * 20)",
    inlineSize: "calc(0.25rem * 32)",
    flexShrink: "0",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "calc(var(--radius) - 2px)",
    backgroundColor: "var(--muted)",
  },
  example4: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
})
