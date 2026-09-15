import * as stylex from "@stylexjs/stylex"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import {
  Group,
  GroupSeparator,
  groupItemStyles,
} from "@/components/ui/stylex/group"

export default function Particle() {
  return (
    <Group aria-label="Pagination">
      <Group aria-label="Page numbers">
        <Button
          variant="outline"
          xstyle={[groupItemStyles.item, exampleStyles.example1]}
        >
          1
        </Button>
        <GroupSeparator />
        <Button
          variant="outline"
          xstyle={[groupItemStyles.item, exampleStyles.example1]}
        >
          2
        </Button>
        <GroupSeparator />
        <Button
          variant="outline"
          xstyle={[groupItemStyles.item, exampleStyles.example1]}
        >
          3
        </Button>
        <GroupSeparator />
        <Button
          variant="outline"
          xstyle={[groupItemStyles.item, exampleStyles.example1]}
        >
          4
        </Button>
        <GroupSeparator />
        <Button
          variant="outline"
          xstyle={[groupItemStyles.item, exampleStyles.example1]}
        >
          5
        </Button>
      </Group>
      <Group aria-label="Navigation">
        <Button
          aria-label="Previous"
          size="icon"
          variant="outline"
          xstyle={groupItemStyles.item}
        >
          <ArrowLeftIcon
            aria-hidden="true"
            {...stylex.props(exampleStyles.icon)}
          />
        </Button>
        <GroupSeparator />
        <Button
          aria-label="Next"
          size="icon"
          variant="outline"
          xstyle={groupItemStyles.item}
        >
          <ArrowRightIcon
            aria-hidden="true"
            {...stylex.props(exampleStyles.icon)}
          />
        </Button>
      </Group>
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
    minInlineSize: "calc(0.25rem * 8)",
  },
})
