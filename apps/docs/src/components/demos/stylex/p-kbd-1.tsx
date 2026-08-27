import * as stylex from "@stylexjs/stylex"

import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <div>
        <p {...stylex.props(demoStyles.demo2)}>Single keys:</p>
        <div {...stylex.props(demoStyles.demo3)}>
          <Kbd>K</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>⌃</Kbd>
          <Kbd>⇧</Kbd>
        </div>
      </div>
      <div>
        <p {...stylex.props(demoStyles.demo2)}>Key combinations:</p>
        <div {...stylex.props(demoStyles.demo3)}>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>Alt</Kbd>
            <Kbd>Delete</Kbd>
          </KbdGroup>
        </div>
      </div>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  demo2: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  demo3: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },
})
