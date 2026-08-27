"use client"

import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import { Checkbox } from "@/components/ui/stylex/checkbox"
import { CheckboxGroup } from "@/components/ui/stylex/checkbox-group"
import { Group, GroupSeparator } from "@/components/ui/stylex/group"
import { Label } from "@/components/ui/stylex/label"
import {
  Popover,
  PopoverClose,
  PopoverDescription,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

const occurrences = [
  { date: "Wed, Jul 15", id: "occurrence-1", time: "9:00 – 9:30am" },
  { date: "Wed, Jul 15", id: "occurrence-2", time: "10:00 – 10:30am" },
  { date: "Wed, Jul 15", id: "occurrence-3", time: "11:00 – 11:30am" },
]

export default function Particle() {
  const [selected, setSelected] = useState(
    occurrences.map((occurrence) => occurrence.id),
  )

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Button size="xs" variant="outline">
        Reject
      </Button>
      <Group aria-label="Confirm booking">
        <Button size="xs">Confirm all</Button>
        <GroupSeparator {...stylex.props(demoStyles.demo2)} />
        <Popover>
          <PopoverTrigger
            render={
              <Button
                aria-label="Choose occurrences to confirm"
                size="icon-xs"
              />
            }
          >
            <ChevronDownIcon aria-hidden="true" />
          </PopoverTrigger>
          <PopoverPopup align="end" {...stylex.props(demoStyles.demo3)}>
            <div {...stylex.props(demoStyles.demo4)}>
              <PopoverTitle {...stylex.props(demoStyles.demo5)}>
                Confirm occurrences
              </PopoverTitle>
              <PopoverDescription {...stylex.props(demoStyles.demo6)}>
                {occurrences.length} pending for this booking
              </PopoverDescription>
            </div>
            <CheckboxGroup
              aria-label="Occurrences to confirm"
              {...stylex.props(demoStyles.demo7)}
              onValueChange={setSelected}
              value={selected}
            >
              {occurrences.map((occurrence) => (
                <Label {...stylex.props(demoStyles.demo8)} key={occurrence.id}>
                  <Checkbox value={occurrence.id} />
                  <span {...stylex.props(demoStyles.demo9)}>
                    {occurrence.time}
                  </span>
                  <span {...stylex.props(demoStyles.demo10)}>
                    {occurrence.date}
                  </span>
                </Label>
              ))}
            </CheckboxGroup>
            <div {...stylex.props(demoStyles.demo11)}>
              <PopoverClose
                disabled={selected.length === 0}
                render={<Button size="xs" variant="ghost" />}
              >
                Reject selected
              </PopoverClose>
              <PopoverClose
                disabled={selected.length === 0}
                render={<Button size="xs" />}
              >
                Confirm selected
                <Badge {...stylex.props(demoStyles.demo12)}>
                  {selected.length}
                </Badge>
              </PopoverClose>
            </div>
          </PopoverPopup>
        </Popover>
      </Group>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },
  demo2: {
    backgroundColor: {
      default: "var(--primary)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary) 72%, transparent)",
    },
  },
  demo3: {
    inlineSize: "calc(0.25rem * 84)",
  },
  demo4: {
    marginBlockEnd: "calc(0.25rem * 3)",
  },
  demo5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  demo6: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  demo7: {
    gap: "0px",
    alignSelf: "stretch",
  },
  demo8: {
    display: "flex",
    inlineSize: "100%",
    gap: "calc(0.25rem * 2)",
    paddingBlock: "calc(0.25rem * 1.5)",
  },
  demo9: {
    fontVariantNumeric: "   tabular-nums ",
  },
  demo10: {
    marginInlineStart: "auto",
    fontWeight: "400",
    color: "var(--muted-foreground)",
  },
  demo11: {
    marginBlockStart: "calc(0.25rem * 3)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "calc(0.25rem * 2)",
  },
  demo12: {
    marginInlineEnd: "calc(0.25rem * -1)",
    color: {
      default: "var(--primary-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary-foreground) 60%, transparent)",
    },
  },
})
