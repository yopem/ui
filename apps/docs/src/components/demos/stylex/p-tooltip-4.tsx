"use client"

import type { ComponentType } from "react"

import * as stylex from "@stylexjs/stylex"
import { LinkIcon, MailIcon, Share2Icon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
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
            <Button aria-label="Copy link" size="icon" variant="outline" />
          }
        >
          <LinkIcon aria-hidden="true" />
        </TooltipTrigger>
        <GroupSeparator orientation="horizontal" />
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareEmailContent}
          render={
            <Button
              aria-label="Share via email"
              size="icon"
              variant="outline"
            />
          }
        >
          <MailIcon aria-hidden="true" />
        </TooltipTrigger>
        <GroupSeparator orientation="horizontal" />
        <TooltipTrigger
          handle={tooltipHandle}
          payload={ShareSocialContent}
          render={
            <Button
              aria-label="Share to social"
              size="icon"
              variant="outline"
            />
          }
        >
          <Share2Icon aria-hidden="true" />
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
  demo1: {
    maxInlineSize: "calc(0.25rem * 40)",
  },
})
