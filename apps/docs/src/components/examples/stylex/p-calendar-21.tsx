"use client"

import type { DateRange } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Flex } from "@/components/ui/flex"
export default function Example() {
  const today = new Date()
  const yesterday = {
    from: subDays(today, 1),
    to: subDays(today, 1),
  }
  const last7Days = {
    from: subDays(today, 6),
    to: today,
  }
  const last30Days = {
    from: subDays(today, 29),
    to: today,
  }
  const monthToDate = {
    from: startOfMonth(today),
    to: today,
  }
  const lastMonth = {
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  }
  const yearToDate = {
    from: startOfYear(today),
    to: today,
  }
  const lastYear = {
    from: startOfYear(subYears(today, 1)),
    to: endOfYear(subYears(today, 1)),
  }
  const [month, setMonth] = useState(today)
  const [date, setDate] = useState<DateRange | undefined>(last7Days)

  return (
    <Flex {...stylex.props(exampleStyles.example1)}>
      <Box {...stylex.props(exampleStyles.example2)}>
        <Flex {...stylex.props(exampleStyles.example3)}>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate({
                from: today,
                to: today,
              })
              setMonth(today)
            }}
            size="sm"
            variant="ghost"
          >
            Today
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(yesterday)
              setMonth(yesterday.to)
            }}
            size="sm"
            variant="ghost"
          >
            Yesterday
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(last7Days)
              setMonth(last7Days.to)
            }}
            size="sm"
            variant="ghost"
          >
            Last 7 days
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(last30Days)
              setMonth(last30Days.to)
            }}
            size="sm"
            variant="ghost"
          >
            Last 30 days
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(monthToDate)
              setMonth(monthToDate.to)
            }}
            size="sm"
            variant="ghost"
          >
            Month to date
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(lastMonth)
              setMonth(lastMonth.to)
            }}
            size="sm"
            variant="ghost"
          >
            Last month
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(yearToDate)
              setMonth(yearToDate.to)
            }}
            size="sm"
            variant="ghost"
          >
            Year to date
          </Button>
          <Button
            {...stylex.props(exampleStyles.example4)}
            onClick={() => {
              setDate(lastYear)
              setMonth(lastYear.to)
            }}
            size="sm"
            variant="ghost"
          >
            Last year
          </Button>
        </Flex>
      </Box>
      <Calendar
        {...stylex.props(exampleStyles.example5)}
        disabled={[{ after: today }]}
        mode="range"
        month={month}
        onMonthChange={setMonth}
        onSelect={(newDate) => {
          if (newDate) {
            setDate(newDate)
          }
        }}
        selected={date}
      />
    </Flex>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: {
      default: null,
      "@media (max-width: 39.999rem)": "column",
    },
  },
  example2: {
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
  example3: {
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
  example4: {
    inlineSize: "100%",
    justifyContent: "flex-start",
  },
  example5: {
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
