"use client"

import type { ComponentType } from "react"

import * as stylex from "@stylexjs/stylex"
import { BoldIcon, ItalicIcon, UnderlineIcon } from "lucide-react"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
const BoldContent = () => {
  return <Box as="span">Make text bold</Box>
}

const ItalicContent = () => {
  return <Box as="span">Apply italic formatting to text</Box>
}

const UnderlineContent = () => {
  return <Box as="span">Underline text</Box>
}

export default function Example() {
  const [tooltipHandle] = useState(() => TooltipCreateHandle<ComponentType>())

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
