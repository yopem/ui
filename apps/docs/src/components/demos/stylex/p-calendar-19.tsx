"use client"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { useState } from "react"

import { Calendar } from "@/components/ui/stylex/calendar"
import { ScrollArea } from "@/components/ui/stylex/scroll-area"
import { Toggle } from "@/components/ui/stylex/toggle"
import { ToggleGroup } from "@/components/ui/stylex/toggle-group"

export default function Particle() {
  const today = new Date()
  const [date, setDate] = useState<Date>(today)
  const [time, setTime] = useState<string | null>(null)

  const timeSlots = [
    { available: false, time: "09:00" },
    { available: false, time: "09:30" },
    { available: true, time: "10:00" },
    { available: true, time: "10:30" },
    { available: true, time: "11:00" },
    { available: true, time: "11:30" },
    { available: false, time: "12:00" },
    { available: true, time: "12:30" },
    { available: true, time: "13:00" },
    { available: true, time: "13:30" },
    { available: true, time: "14:00" },
    { available: false, time: "14:30" },
    { available: false, time: "15:00" },
    { available: true, time: "15:30" },
    { available: true, time: "16:00" },
    { available: true, time: "16:30" },
    { available: true, time: "17:00" },
    { available: true, time: "17:30" },
  ]

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <Calendar
        {...stylex.props(demoStyles.demo2)}
        disabled={[{ before: today }]}
        mode="single"
        onSelect={(newDate) => {
          if (newDate) {
            setDate(newDate)
            setTime(null)
          }
        }}
        selected={date}
      />
      <div {...stylex.props(demoStyles.demo3)}>
        <div {...stylex.props(demoStyles.demo4)}>
          <ScrollArea
            {...stylex.props(demoStyles.demo5)}
            overscrollContain
            scrollbarGutter
            scrollFade
          >
            <div {...stylex.props(demoStyles.demo6)}>
              <div {...stylex.props(demoStyles.demo7)}>
                {format(date, "EEEE, d")}
              </div>
              <ToggleGroup
                {...stylex.props(demoStyles.demo8)}
                onValueChange={(values) => setTime(values[0] || null)}
                value={time ? [time] : []}
              >
                {timeSlots.map(({ time: timeSlot, available }) => (
                  <Toggle
                    disabled={!available}
                    key={timeSlot}
                    size="sm"
                    value={timeSlot}
                    variant="outline"
                  >
                    {timeSlot}
                  </Toggle>
                ))}
              </ToggleGroup>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

const demoStyles = stylex.create({
  demo1: {
    display: "flex",
    flexDirection: {
      default: null,
      "@media (max-width: 39.999rem)": "column",
    },
  },
  demo2: {
    paddingBlockEnd: {
      default: null,
      "@media (max-width: 39.999rem)": "calc(0.25rem * 3)",
    },
    paddingInlineEnd: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 5)",
    },
  },
  demo3: {
    position: "relative",
    inlineSize: {
      default: "100%",
      "@media (min-width: 40rem)": "calc(0.25rem * 40)",
    },
    blockSize: {
      default: null,
      "@media (max-width: 39.999rem)": "calc(0.25rem * 48)",
    },
  },
  demo4: {
    position: "absolute",
    inset: "0px",
    borderBlockStartStyle: {
      default: null,
      "@media (max-width: 39.999rem)": "solid",
    },
    borderBlockStartWidth: {
      default: null,
      "@media (max-width: 39.999rem)": "1px",
    },
  },
  demo5: {
    blockSize: "100%",
    borderInlineStartStyle: {
      default: null,
      "@media (min-width: 40rem)": "solid",
    },
    borderInlineStartWidth: {
      default: null,
      "@media (min-width: 40rem)": "1px",
    },
  },
  demo6: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 3)",
    paddingBlock: "calc(0.25rem * 3)",
    paddingBlockStart: {
      default: null,
      "@media (min-width: 40rem)": "0px",
    },
    paddingBlockEnd: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 2)",
    },
  },
  demo7: {
    display: "flex",
    flexShrink: "0",
    alignItems: "center",
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
    blockSize: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 8)",
    },
    paddingInline: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 5)",
    },
  },
  demo8: {
    display: "grid",
    inlineSize: "100%",
    gap: "calc(0.25rem * 1.5)",
    gridTemplateColumns: {
      default: null,
      "@media (max-width: 39.999rem)": "repeat(2, minmax(0, 1fr))",
    },
    paddingInline: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 5)",
    },
  },
})
