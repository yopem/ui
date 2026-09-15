"use client"

import * as stylex from "@stylexjs/stylex"
import { ChevronDownIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import { Checkbox } from "@/components/ui/stylex/checkbox"
import { CheckboxGroup } from "@/components/ui/stylex/checkbox-group"
import {
  groupItemStyles,
  Group,
  GroupSeparator,
} from "@/components/ui/stylex/group"
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
  const [selected, setSelected] = useState(() =>
    occurrences.map((occurrence) => occurrence.id),
  )

  return (
    <div {...stylex.props(exampleStyles.example1)}>
      <Button size="xs" variant="outline">
        Reject
      </Button>
      <Group aria-label="Confirm booking">
        <Button xstyle={groupItemStyles.item} size="xs">
          Confirm all
        </Button>
        <GroupSeparator {...stylex.props(exampleStyles.example2)} />
        <Popover>
          <PopoverTrigger
            render={
              <Button
                xstyle={groupItemStyles.item}
                aria-label="Choose occurrences to confirm"
                size="icon-xs"
              />
            }
          >
            <ChevronDownIcon
              {...stylex.props(exampleStyles.icon)}
              aria-hidden="true"
            />
          </PopoverTrigger>
          <PopoverPopup align="end" {...stylex.props(exampleStyles.example3)}>
            <div {...stylex.props(exampleStyles.example4)}>
              <PopoverTitle {...stylex.props(exampleStyles.example5)}>
                Confirm occurrences
              </PopoverTitle>
              <PopoverDescription {...stylex.props(exampleStyles.example6)}>
                {occurrences.length} pending for this booking
              </PopoverDescription>
            </div>
            <CheckboxGroup
              aria-label="Occurrences to confirm"
              {...stylex.props(exampleStyles.example7)}
              onValueChange={setSelected}
              value={selected}
            >
              {occurrences.map((occurrence) => (
                <Label
                  {...stylex.props(exampleStyles.example8)}
                  key={occurrence.id}
                >
                  <Checkbox value={occurrence.id} />
                  <span {...stylex.props(exampleStyles.example9)}>
                    {occurrence.time}
                  </span>
                  <span {...stylex.props(exampleStyles.example10)}>
                    {occurrence.date}
                  </span>
                </Label>
              ))}
            </CheckboxGroup>
            <div {...stylex.props(exampleStyles.example11)}>
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
                <Badge {...stylex.props(exampleStyles.example12)}>
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

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    inlineSize: { default: "1rem", "@media (min-width: 640px)": "0.875rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    display: "flex",
    gap: "calc(0.25rem * 2)",
  },
  example2: {
    backgroundColor: {
      default: "var(--primary)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary) 72%, transparent)",
    },
  },
  example3: {
    inlineSize: "calc(0.25rem * 84)",
  },
  example4: {
    marginBlockEnd: "calc(0.25rem * 3)",
  },
  example5: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
  },
  example6: {
    fontSize: "0.75rem",
    lineHeight: "calc(1 / 0.75)",
  },
  example7: {
    gap: "0px",
    alignSelf: "stretch",
  },
  example8: {
    display: "flex",
    inlineSize: "100%",
    gap: "calc(0.25rem * 2)",
    paddingBlock: "calc(0.25rem * 1.5)",
  },
  example9: {
    fontVariantNumeric: "   tabular-nums ",
  },
  example10: {
    marginInlineStart: "auto",
    fontWeight: "400",
    color: "var(--muted-foreground)",
  },
  example11: {
    marginBlockStart: "calc(0.25rem * 3)",
    display: "flex",
    justifyContent: "flex-end",
    gap: "calc(0.25rem * 2)",
  },
  example12: {
    marginInlineEnd: "calc(0.25rem * -1)",
    color: {
      default: "var(--primary-foreground)",
      "@supports (color: color-mix(in lab, red, red))":
        "color-mix(in oklab, var(--primary-foreground) 60%, transparent)",
    },
  },
})
