"use client"

import * as stylex from "@stylexjs/stylex"
import { addDays, format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Box } from "@/components/ui/stylex/box"
import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"
import { Flex } from "@/components/ui/stylex/flex"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"
export default function Example() {
  const today = new Date()
  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<Date | undefined>(today)

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button {...stylex.props(exampleStyles.example1)} variant="outline" />
        }
      >
        <CalendarIcon
          {...stylex.props(exampleStyles.icon)}
          aria-hidden="true"
        />
        {date ? format(date, "PPP") : "Pick a date"}
      </PopoverTrigger>
      <PopoverPopup>
        <Flex {...stylex.props(exampleStyles.example2)}>
          <Box {...stylex.props(exampleStyles.example3)}>
            <Flex {...stylex.props(exampleStyles.example4)}>
              <Button
                {...stylex.props(exampleStyles.example1)}
                onClick={() => {
                  setDate(today)
                  setMonth(today)
                }}
                size="sm"
                variant="ghost"
              >
                Today
              </Button>
              <Button
                {...stylex.props(exampleStyles.example1)}
                onClick={() => {
                  const tomorrow = addDays(today, 1)
                  setDate(tomorrow)
                  setMonth(tomorrow)
                }}
                size="sm"
                variant="ghost"
              >
                Tomorrow
              </Button>
              <Button
                {...stylex.props(exampleStyles.example1)}
                onClick={() => {
                  const in3Days = addDays(today, 3)
                  setDate(in3Days)
                  setMonth(in3Days)
                }}
                size="sm"
                variant="ghost"
              >
                In 3 days
              </Button>
              <Button
                {...stylex.props(exampleStyles.example1)}
                onClick={() => {
                  const inAWeek = addDays(today, 7)
                  setDate(inAWeek)
                  setMonth(inAWeek)
                }}
                size="sm"
                variant="ghost"
              >
                In a week
              </Button>
            </Flex>
          </Box>
          <Calendar
            {...stylex.props(exampleStyles.example5)}
            mode="single"
            month={month}
            onMonthChange={setMonth}
            onSelect={setDate}
            selected={date}
          />
        </Flex>
      </PopoverPopup>
    </Popover>
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
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
  example2: {
    display: "flex",
    flexDirection: {
      default: null,
      "@media (max-width: 39.999rem)": "column",
    },
  },
  example3: {
    position: "relative",
    paddingBlock: "0.25rem",
    paddingInlineStart: "0.25rem",
    order: {
      default: null,
      "@media (max-width: 39.999rem)": "1",
    },
    borderBlockStartStyle: {
      default: null,
      "@media (max-width: 39.999rem)": "solid",
    },
    borderBlockStartWidth: {
      default: null,
      "@media (max-width: 39.999rem)": "1px",
    },
  },
  example4: {
    display: "flex",
    blockSize: "100%",
    flexDirection: "column",
    borderInlineEndStyle: {
      default: null,
      "@media (min-width: 40rem)": "solid",
    },
    borderInlineEndWidth: {
      default: null,
      "@media (min-width: 40rem)": "1px",
    },
    paddingInlineEnd: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 3)",
    },
  },
  example5: {
    paddingBlockEnd: {
      default: null,
      "@media (max-width: 39.999rem)": "calc(0.25rem * 3)",
    },
    paddingInlineStart: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 2)",
    },
  },
})
