import * as stylex from "@stylexjs/stylex"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { Button } from "@/components/ui/stylex/button"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"

export default function Particle() {
  return (
    <Group aria-label="Pagination">
      <Group aria-label="Page numbers">
        <Button {...stylex.props(demoStyles.demo1)} variant="outline">
          1
        </Button>
        <GroupSeparator />
        <Button {...stylex.props(demoStyles.demo1)} variant="outline">
          2
        </Button>
        <GroupSeparator />
        <Button {...stylex.props(demoStyles.demo1)} variant="outline">
          3
        </Button>
        <GroupSeparator />
        <Button {...stylex.props(demoStyles.demo1)} variant="outline">
          4
        </Button>
        <GroupSeparator />
        <Button {...stylex.props(demoStyles.demo1)} variant="outline">
          5
        </Button>
      </Group>
      <Group aria-label="Navigation">
        <Button aria-label="Previous" size="icon" variant="outline">
          <ArrowLeftIcon aria-hidden="true" />
        </Button>
        <GroupSeparator />
        <Button aria-label="Next" size="icon" variant="outline">
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </Group>
    </Group>
  )
}

const demoStyles = stylex.create({
  demo1: {
    minInlineSize: "calc(0.25rem * 8)",
  },
})
