"use client"

import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, LinkIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/stylex/input-group"
import { Toggle } from "@/components/ui/stylex/toggle"

export default function Example() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Tell us about yourself…" />
      <InputGroupAddon
        align="block-start"
        {...stylex.props(exampleStyles.example1)}
      >
        <Toggle aria-label="Toggle bold" size="sm">
          <BoldIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </Toggle>
        <Toggle aria-label="Toggle italic" size="sm">
          <ItalicIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </Toggle>
        <Button aria-label="Link" size="icon-sm" variant="ghost">
          <LinkIcon {...stylex.props(exampleStyles.icon2)} aria-hidden="true" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  icon2: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    gap: "0.25rem",
    borderTopLeftRadius: "var(--radius)",
    borderTopRightRadius: "var(--radius)",
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    backgroundColor: {
      default: "var(--muted)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--muted) 72%, transparent)",
    },
    padding: "calc(0.25rem * 2)",
  },
})
