"use client"

import type { ComponentType } from "react"

import * as stylex from "@stylexjs/stylex"
import { BellIcon, UserIcon } from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/stylex/avatar"
import { Button } from "@/components/ui/stylex/button"
import {
  Popover,
  PopoverCreateHandle,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

const popoverHandle = PopoverCreateHandle<ComponentType>()

const NotificationsContent = () => {
  return (
    <>
      <PopoverTitle {...stylex.props(demoStyles.demo1)}>
        Notifications
      </PopoverTitle>
      <PopoverDescription>
        You have no new notifications at this time.
      </PopoverDescription>
    </>
  )
}

const ProfileContent = () => {
  return (
    <div {...stylex.props(demoStyles.demo2)}>
      <div {...stylex.props(demoStyles.demo3)}>
        <Avatar>
          <AvatarImage
            alt="Mark Andersson"
            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=128&h=128&dpr=2&q=80"
          />
          <AvatarFallback>MA</AvatarFallback>
        </Avatar>
        <div {...stylex.props(demoStyles.demo4)}>
          <h4 {...stylex.props(demoStyles.demo5)}>Mark Andersson</h4>
          <div {...stylex.props(demoStyles.demo6)}>Product Designer</div>
        </div>
      </div>
      <Button {...stylex.props(demoStyles.demo7)} size="sm" variant="outline">
        Log out
      </Button>
    </div>
  )
}

export default function Particle() {
  return (
    <div {...stylex.props(demoStyles.demo8)}>
      <PopoverTrigger
        handle={popoverHandle}
        payload={NotificationsContent}
        render={
          <Button aria-label="Notifications" size="icon" variant="outline" />
        }
      >
        <BellIcon aria-hidden="true" />
      </PopoverTrigger>
      <PopoverTrigger
        handle={popoverHandle}
        payload={ProfileContent}
        render={<Button aria-label="Profile" size="icon" variant="outline" />}
      >
        <UserIcon aria-hidden="true" />
      </PopoverTrigger>
      <Popover handle={popoverHandle}>
        {({ payload: Payload }) => (
          <PopoverPopup {...stylex.props(demoStyles.report1Manual)}>
            {Payload !== undefined && <Payload />}
          </PopoverPopup>
        )}
      </Popover>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
  demo2: {
    inlineSize: "calc(0.25rem * 48)",
  },
  demo3: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
  },
  demo4: {
    minInlineSize: "0px",
    flex: "1",
  },
  demo5: {
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: "1",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
  },
  demo6: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 3)",
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
    color: "var(--muted-foreground)",
  },
  demo7: {
    marginBlockStart: "calc(0.25rem * 3)",
    inlineSize: "100%",
  },
  demo8: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },

  report1Manual: {
    minInlineSize: 0,
  },
})
