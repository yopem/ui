"use client"

import * as stylex from "@stylexjs/stylex"
import { subDays, subMonths, subYears } from "date-fns"
import { useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Calendar } from "@/components/ui/stylex/calendar"

export default function Particle() {
  const today = new Date()
  const yesterday = subDays(today, 1)
  const lastWeek = subDays(today, 7)
  const lastMonth = subMonths(today, 1)
  const lastYear = subYears(today, 1)
  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<Date>(today)

  return (
    <div {...stylex.props(demoStyles.demo1)}>
      <div {...stylex.props(demoStyles.demo2)}>
        <div {...stylex.props(demoStyles.demo3)}>
          <Button
            {...stylex.props(demoStyles.demo4)}
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
            {...stylex.props(demoStyles.demo4)}
            onClick={() => {
              setDate(yesterday)
              setMonth(yesterday)
            }}
            size="sm"
            variant="ghost"
          >
            Yesterday
          </Button>
          <Button
            {...stylex.props(demoStyles.demo4)}
            onClick={() => {
              setDate(lastWeek)
              setMonth(lastWeek)
            }}
            size="sm"
            variant="ghost"
          >
            Last week
          </Button>
          <Button
            {...stylex.props(demoStyles.demo4)}
            onClick={() => {
              setDate(lastMonth)
              setMonth(lastMonth)
            }}
            size="sm"
            variant="ghost"
          >
            Last month
          </Button>
          <Button
            {...stylex.props(demoStyles.demo4)}
            onClick={() => {
              setDate(lastYear)
              setMonth(lastYear)
            }}
            size="sm"
            variant="ghost"
          >
            Last year
          </Button>
        </div>
      </div>
      <Calendar
        {...stylex.props(demoStyles.demo5)}
        disabled={[{ after: today }]}
        mode="single"
        month={month}
        onMonthChange={setMonth}
        onSelect={(newDate) => {
          if (newDate) {
            setDate(newDate)
          }
        }}
        selected={date}
      />
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
  demo3: {
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
  demo4: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
  demo5: {
    paddingBlockEnd: {
      default: null,
      "@media (max-width: 39.999rem)": "calc(0.25rem * 3)",
    },
    paddingInlineStart: {
      default: null,
      "@media (min-width: 40rem)": "calc(0.25rem * 5)",
    },
  },
})
