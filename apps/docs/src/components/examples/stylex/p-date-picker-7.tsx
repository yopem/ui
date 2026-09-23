"use client"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverPopup, PopoverTrigger } from "@/components/ui/popover"
export default function Example() {
  const [dates, setDates] = useState<Date[] | undefined>()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button {...stylex.props(exampleStyles.example1)} variant="outline" />
        }
      >
        <CalendarIcon
          {...stylex.props(exampleStyles.icon, exampleStyles.example2)}
        />
        <Box as="span" {...stylex.props(exampleStyles.example3)}>
          {dates && dates.length > 0 ? (
            <>
              {dates.slice(0, 3).map((date) => (
                <Badge key={date.toISOString()} variant="secondary">
                  {format(date, "MMM d")}
                </Badge>
              ))}
              {dates.length > 3 && (
                <Badge variant="secondary">+{dates.length - 3}</Badge>
              )}
            </>
          ) : (
            <Box as="span">Pick dates</Box>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar mode="multiple" onSelect={setDates} selected={dates} />
      </PopoverPopup>
    </Popover>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
  example2: {
    flexShrink: "0",
  },
  example3: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
})
