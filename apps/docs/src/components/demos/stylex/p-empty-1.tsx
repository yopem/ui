import * as stylex from "@stylexjs/stylex"
import { BookIcon, RouteIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/stylex/empty"

export default function Particle() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <RouteIcon {...stylex.props(demoStyles.icon)} />
        </EmptyMedia>
        <EmptyTitle>No upcoming meetings</EmptyTitle>
        <EmptyDescription>Create a meeting to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div {...stylex.props(demoStyles.demo1)}>
          <Button size="sm">Create meeting</Button>
          <Button size="sm" variant="outline">
            <BookIcon {...stylex.props(demoStyles.icon2)} />
            View docs
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: "1.125rem",
    inlineSize: "1.125rem",
    flexShrink: 0,
    pointerEvents: "none",
  },
  icon2: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },
})
