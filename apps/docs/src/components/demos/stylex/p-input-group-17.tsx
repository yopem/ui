"use client"

import * as stylex from "@stylexjs/stylex"
import { ArrowUpIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/stylex/input-group"
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from "@/components/ui/stylex/menu"
import {
  Tooltip,
  TooltipPopup,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

export default function Particle() {
  return (
    <InputGroup>
      <InputGroupTextarea placeholder="Ask, Search or Chat…" />
      <InputGroupAddon align="block-end">
        <Menu>
          <Tooltip>
            <TooltipTrigger
              render={
                <MenuTrigger
                  render={
                    <Button
                      aria-label="Add files"
                      {...stylex.props(demoStyles.demo1)}
                      size="icon-sm"
                      variant="ghost"
                    />
                  }
                >
                  <PlusIcon {...stylex.props(demoStyles.icon)} />
                </MenuTrigger>
              }
            />
            <TooltipPopup>Add files and more</TooltipPopup>
          </Tooltip>
          <MenuPopup align="start">
            <MenuItem>Add photos &amp; files</MenuItem>
            <MenuItem>Create image</MenuItem>
            <MenuItem>Thinking</MenuItem>
            <MenuItem>Deep research</MenuItem>
          </MenuPopup>
        </Menu>
        <InputGroupText {...stylex.props(demoStyles.demo2)}>
          78% used
        </InputGroupText>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Send"
                {...stylex.props(demoStyles.demo1)}
                size="icon-sm"
                variant="default"
              >
                <ArrowUpIcon {...stylex.props(demoStyles.icon)} />
              </Button>
            }
          />
          <TooltipPopup>Send</TooltipPopup>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    borderRadius: "calc(infinity * 1px)",
  },
  demo2: {
    marginInlineStart: "auto",
  },
})
