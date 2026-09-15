"use client"

import type { ComponentType } from "react"

import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/stylex/toggle-group"
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

const tooltipHandle = TooltipCreateHandle<ComponentType>()

const BoldContent = () => {
  return <span>Make text bold</span>
}

const ItalicContent = () => {
  return <span>Apply italic formatting to text</span>
}

const UnderlineContent = () => {
  return <span>Underline text</span>
}

export default function Particle() {
  return (
    <TooltipProvider>
      <ToggleGroup defaultValue={["bold"]} multiple>
        <TooltipTrigger
          {...stylex.props(exampleStyles.example1)}
          handle={tooltipHandle}
          payload={BoldContent}
          render={<ToggleGroupItem aria-label="Toggle bold" value="bold" />}
        >
          <BoldIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipTrigger
          {...stylex.props(exampleStyles.example1)}
          handle={tooltipHandle}
          payload={ItalicContent}
          render={<ToggleGroupItem aria-label="Toggle italic" value="italic" />}
        >
          <ItalicIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </TooltipTrigger>
        <TooltipTrigger
          {...stylex.props(exampleStyles.example1)}
          handle={tooltipHandle}
          payload={UnderlineContent}
          render={
            <ToggleGroupItem aria-label="Toggle underline" value="underline" />
          }
        >
          <UnderlineIcon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </TooltipTrigger>
      </ToggleGroup>

      <Tooltip handle={tooltipHandle}>
        {({ payload: Payload }) => (
          <TooltipPopup>{Payload !== undefined && <Payload />}</TooltipPopup>
        )}
      </Tooltip>
    </TooltipProvider>
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
  example1: {
    "::after": {
      content: '""',
      position: "absolute",
      insetInlineStart: "100%",
      blockSize: "100%",
      inlineSize: "0.25rem",
    },
  },
})
