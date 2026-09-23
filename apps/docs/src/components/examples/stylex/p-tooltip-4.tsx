"use client"

import type { ComponentType } from "react"

import * as stylex from "@stylexjs/stylex"
import { LinkIcon, MailIcon, Share2Icon } from "lucide-react"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { groupItemStyles, Group, GroupSeparator } from "@/components/ui/group"
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
const ShareLinkContent = () => {
  return <Box as="span">Copy shareable link</Box>
}

const ShareEmailContent = () => {
  return <Box as="span">Share via email</Box>
}

const ShareSocialContent = () => {
  return <Box as="span">Share to social media</Box>
}

export default function Example() {
  const [tooltipHandle] = useState(() => TooltipCreateHandle<ComponentType>())

  return (
    <TooltipProvider>
      <Group aria-label="Share options" orientation="vertical">
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareLinkContent}
          render={
            <Button
              xstyle={groupItemStyles.item}
              aria-label="Copy link"
              size="icon"
              variant="outline"
            />
          }
        >
          <LinkIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </TooltipTrigger>
        <GroupSeparator orientation="horizontal" />
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareEmailContent}
          render={
            <Button
              xstyle={groupItemStyles.item}
              aria-label="Share via email"
              size="icon"
              variant="outline"
            />
          }
        >
          <MailIcon {...stylex.props(exampleStyles.icon)} aria-hidden="true" />
        </TooltipTrigger>
        <GroupSeparator orientation="horizontal" />
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareSocialContent}
          render={
            <Button
              xstyle={groupItemStyles.item}
              aria-label="Share to social"
              size="icon"
              variant="outline"
            />
          }
        >
          <Share2Icon
            {...stylex.props(exampleStyles.icon)}
            aria-hidden="true"
          />
        </TooltipTrigger>
      </Group>
      <Tooltip handle={tooltipHandle}>
        {({ payload: Payload }) => (
          <TooltipPopup {...stylex.props(exampleStyles.example1)} side="right">
            {Payload !== undefined && <Payload />}
          </TooltipPopup>
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
    marginInline: "-0.125rem",
  },
  example1: {
    maxInlineSize: "calc(0.25rem * 40)",
  },
})
