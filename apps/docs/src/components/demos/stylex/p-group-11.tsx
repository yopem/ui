import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon, GitForkIcon } from "lucide-react"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  return (
    <Group aria-label="Repository actions">
      <Button variant="outline">
        <GitForkIcon aria-hidden="true" />
        Fork
        <Badge variant="secondary">48</Badge>
      </Button>
      <GroupSeparator />
      <Popover>
        <PopoverTrigger
          render={
            <Button aria-label="Send options" size="icon" variant="outline" />
          }
        >
          <ChevronDownIcon aria-hidden="true" />
        </PopoverTrigger>
        <PopoverPopup align="end" {...stylex.props(demoStyles.demo1)}>
          <PopoverTitle {...stylex.props(demoStyles.demo2)}>
            Existing forks
          </PopoverTitle>
          <PopoverDescription>
            You don't have any forks of this repository.
          </PopoverDescription>
        </PopoverPopup>
      </Popover>
    </Group>
  )
}

const demoStyles = stylex.create({
  demo1: {
    inlineSize: "calc(0.25rem * 64)",
  },
  demo2: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
})
