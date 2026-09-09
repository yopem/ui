"use client"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/stylex/badge"
import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"

export default function Particle() {
  const [dates, setDates] = useState<Date[] | undefined>()

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button {...stylex.props(demoStyles.demo1)} variant="outline" />
        }
      >
        <CalendarIcon {...stylex.props(demoStyles.icon, demoStyles.demo2)} />
        <span {...stylex.props(demoStyles.demo3)}>
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
            <span>Pick dates</span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar mode="multiple" onSelect={setDates} selected={dates} />
      </PopoverPopup>
    </Popover>
  )
}

const demoStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  demo1: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
  demo2: {
    flexShrink: "0",
  },
  demo3: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
})
