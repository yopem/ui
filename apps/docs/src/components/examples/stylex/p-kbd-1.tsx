import * as stylex from "@stylexjs/stylex"

import { Kbd, KbdGroup } from "@/components/ui/stylex/kbd"

export default function Example() {
  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <div>
        <p {...stylex.props(exampleStyles.example2)}>Single keys:</p>
        <div {...stylex.props(exampleStyles.example3)}>
          <Kbd>K</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>⌃</Kbd>
          <Kbd>⇧</Kbd>
        </div>
      </div>
      <div>
        <p {...stylex.props(exampleStyles.example2)}>Key combinations:</p>
        <div {...stylex.props(exampleStyles.example3)}>
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

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 4)",
  },
  example2: {
    marginBlockEnd: "calc(0.25rem * 2)",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
  example3: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },
})
