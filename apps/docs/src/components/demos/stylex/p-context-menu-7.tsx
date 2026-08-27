import * as stylex from "@stylexjs/stylex"

import {
  ContextMenu,
  ContextMenuPopup,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuTrigger,
} from "@/components/ui/stylex/context-menu"

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger {...stylex.props(demoStyles.demo1)}>
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuRadioGroup defaultValue="system">
          <ContextMenuRadioItem value="light">Light</ContextMenuRadioItem>
          <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
          <ContextMenuRadioItem value="system">System</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    blockSize: "calc(0.25rem * 32)",
    inlineSize: "100%",
    maxInlineSize: "24rem",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius)",
    borderStyle: "dashed",
    borderWidth: "1px",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    color: "var(--muted-foreground)",
  },
})
