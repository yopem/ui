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

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Tell us about yourself…" />
      <InputGroupAddon align="block-start" {...stylex.props(demoStyles.demo1)}>
        <Toggle aria-label="Toggle bold" size="sm">
          <BoldIcon aria-hidden="true" />
        </Toggle>
        <Toggle aria-label="Toggle italic" size="sm">
          <ItalicIcon aria-hidden="true" />
        </Toggle>
        <Button aria-label="Link" size="icon-sm" variant="ghost">
          <LinkIcon aria-hidden="true" />
        </Button>
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
  demo1: {
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
