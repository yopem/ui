// next/link replaced -> anchor
import * as stylex from "@stylexjs/stylex"

import {
  ContextMenu,
  ContextMenuLinkItem,
  ContextMenuPopup,
  ContextMenuTrigger,
} from "@/components/ui/stylex/context-menu"

export default function Particle() {
  return (
    <ContextMenu>
      <ContextMenuTrigger {...stylex.props(exampleStyles.example1)}>
        Right click here
      </ContextMenuTrigger>
      <ContextMenuPopup>
        <ContextMenuLinkItem render={<a aria-label="Particles" href="/docs" />}>
          Docs
        </ContextMenuLinkItem>
        <ContextMenuLinkItem
          render={<a aria-label="Particles" href="/particles" />}
        >
          Particles
        </ContextMenuLinkItem>
      </ContextMenuPopup>
    </ContextMenu>
  )
}

const exampleStyles = stylex.create({
  example1: {
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
