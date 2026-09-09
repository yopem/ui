"use client"

import type { ComponentType } from "react"

import * as stylex from "@stylexjs/stylex"
import { LinkIcon, MailIcon, Share2Icon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  groupItemStyles,
  Group,
  GroupSeparator,
} from "@/components/ui/stylex/group"
import {
  Tooltip,
  TooltipCreateHandle,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

const tooltipHandle = TooltipCreateHandle<ComponentType>()

const ShareLinkContent = () => {
  return <span>Copy shareable link</span>
}

const ShareEmailContent = () => {
  return <span>Share via email</span>
}

const ShareSocialContent = () => {
  return <span>Share to social media</span>
}

export default function Particle() {
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
          <LinkIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
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
          <MailIcon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
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
          <Share2Icon {...stylex.props(demoStyles.icon)} aria-hidden="true" />
        </TooltipTrigger>
      </Group>
      <Tooltip handle={tooltipHandle}>
        {({ payload: Payload }) => (
          <TooltipPopup {...stylex.props(demoStyles.demo1)} side="right">
            {Payload !== undefined && <Payload />}
          </TooltipPopup>
        )}
      </Tooltip>
    </TooltipProvider>
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
    maxInlineSize: "calc(0.25rem * 40)",
  },
})
