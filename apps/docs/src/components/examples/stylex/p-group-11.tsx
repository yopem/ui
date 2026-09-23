import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon, GitForkIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Group, GroupSeparator, groupItemStyles } from "@/components/ui/group"
import {
  Popover,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function Example() {
  return (
    <Group aria-label="Repository actions">
      <Button variant="outline" xstyle={groupItemStyles.item}>
        <GitForkIcon aria-hidden="true" {...stylex.props(exampleStyles.icon)} />
        Fork
        <Badge variant="secondary">48</Badge>
      </Button>
      <GroupSeparator />
      <Popover>
        <PopoverTrigger
          render={
            <Button
              aria-label="Send options"
              size="icon"
              variant="outline"
              xstyle={groupItemStyles.item}
            />
          }
        >
          <ChevronDownIcon
            aria-hidden="true"
            {...stylex.props(exampleStyles.icon)}
          />
        </PopoverTrigger>
        <PopoverPopup align="end" xstyle={exampleStyles.example1}>
          <PopoverTitle xstyle={exampleStyles.example2}>
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
    inlineSize: "calc(0.25rem * 64)",
  },
  example2: {
    fontSize: "1rem",
    lineHeight: "calc(1.5 / 1)",
  },
})
