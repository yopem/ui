"use client"

import type { DayButtonProps } from "@daypicker/react"

import * as stylex from "@stylexjs/stylex"
import { format } from "date-fns"
import { useState } from "react"

import { Box } from "@/components/ui/box"
import { Calendar } from "@/components/ui/calendar"
const GOOD_PRICE_THRESHOLD = 100

export default function Example() {
  const today = new Date()
  const [date, setDate] = useState<Date | undefined>(today)

  const [mockPriceData] = useState<Record<string, number>>(() => {
    const data: Record<string, number> = {}
    const todayDate = new Date()

    for (let i = 0; i < 180; i++) {
      const d = new Date(todayDate)
      d.setDate(todayDate.getDate() + i)
      const dateKey = format(d, "yyyy-MM-dd")
      const randomPrice = Math.floor(Math.random() * (200 - 80 + 1)) + 80
      data[dateKey] = randomPrice
    }
    return data
  })

  const isDateDisabled = (date: Date) => {
    return !mockPriceData[format(date, "yyyy-MM-dd")]
  }

  return (
    <Calendar
      classNames={{
        day_button: stylex.props(exampleStyles.dayButton).className,
        month: stylex.props(exampleStyles.month).className,
        months: stylex.props(exampleStyles.months).className,
        today: stylex.props(exampleStyles.today).className,
        weekday: stylex.props(exampleStyles.weekday).className,
      }}
      components={{
        DayButton: (props: DayButtonProps) => (
          <DayButton {...props} prices={mockPriceData} />
        ),
      }}
      disabled={isDateDisabled}
      mode="single"
      numberOfMonths={2}
      onSelect={setDate}
      pagedNavigation
      selected={date}
      showOutsideDays={false}
    />
  )
}

function DayButton(props: DayButtonProps & { prices: Record<string, number> }) {
  const { day, prices, modifiers, ...buttonProps } = props
  const price = prices[format(day.date, "yyyy-MM-dd")]
  const isGoodPrice = price !== undefined && price < GOOD_PRICE_THRESHOLD

  return (
    <Box as="button" {...buttonProps}>
      <Box as="span" {...stylex.props(exampleStyles.example1)}>
        {props.children}
        {price && (
          <Box
            as="span"
            {...stylex.props(
              exampleStyles.price,
              modifiers.selected
                ? exampleStyles.selectedPrice
                : isGoodPrice
                  ? exampleStyles.goodPrice
                  : exampleStyles.regularPrice,
            )}
          >
            ${price}
          </Box>
        )}
      </Box>
    </Box>
  )
}

const exampleStyles = stylex.create({
  example1: {
    display: "flex",
    flexDirection: "column",
  },
  dayButton: {
    blockSize: "3rem",
    inlineSize: "3rem",
  },
  month: {
    position: "relative",
    "::before": {
      backgroundColor: "var(--border)",
      content: '""',
      position: "absolute",
      "@media (max-width: 767px)": {
        blockSize: "1px",
        insetBlockStart: "-1rem",
        insetInline: "0.5rem",
      },
      "@media (min-width: 768px)": {
        blockSize: "auto",
        inlineSize: "1px",
        insetBlock: "0.5rem",
        insetInlineStart: "-1rem",
      },
    },
    ":first-of-type::before": { display: "none" },
  },
  months: {
    gap: "2rem",
    "@media (min-width: 640px) and (max-width: 767px)": {
      flexDirection: "column",
    },
    "@media (min-width: 768px)": { flexDirection: "row" },
  },
  today: {
    "::after": { display: "none" },
  },
  weekday: { inlineSize: "3rem" },
  price: {
    fontSize: "0.75rem",
    fontWeight: 400,
    lineHeight: "1rem",
  },
  goodPrice: { color: "var(--success-foreground)" },
  regularPrice: { color: "var(--muted-foreground)" },
  selectedPrice: { color: "var(--primary-foreground)" },
})
