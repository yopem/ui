"use client"

import * as stylex from "@stylexjs/stylex"
import { CopyIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useId, useState } from "react"

import { Button } from "@/components/ui/stylex/button"
import { Checkbox } from "@/components/ui/stylex/checkbox"
import { CheckboxGroup } from "@/components/ui/stylex/checkbox-group"
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/stylex/combobox"
import {
  groupItemStyles,
  Group,
  GroupSeparator,
  GroupText,
} from "@/components/ui/stylex/group"
import { Label } from "@/components/ui/stylex/label"
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/stylex/popover"
import { Switch } from "@/components/ui/stylex/switch"
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/stylex/tooltip"

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const

type Day = (typeof days)[number]

interface TimeRange {
  id: number
  start: string
  end: string
}

const timeOptions = Array.from({ length: 96 }, (_, i) => {
  const hours = Math.floor(i / 4)
  const minutes = (i % 4) * 15
  const period = hours < 12 ? "AM" : "PM"
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
})

const timeIndex = (time: string) => timeOptions.indexOf(time)

let rangeId = 0
const createRange = (start: string, end: string): TimeRange => ({
  end,
  id: ++rangeId,
  start,
})

const defaultAvailability: Record<Day, TimeRange[]> = {
  Friday: [createRange("9:00 AM", "5:00 PM")],
  Monday: [createRange("9:00 AM", "5:00 PM")],
  Saturday: [],
  Sunday: [],
  Thursday: [createRange("9:00 AM", "5:00 PM")],
  Tuesday: [
    createRange("9:00 AM", "1:00 PM"),
    createRange("3:00 PM", "5:00 PM"),
  ],
  Wednesday: [createRange("9:00 AM", "5:00 PM")],
}

function TimeSearch() {
  return (
    <div {...stylex.props(exampleStyles.example3)}>
      <ComboboxInput
        {...stylex.props(exampleStyles.example4)}
        placeholder="Search time"
        showTrigger={false}
        size="sm"
        startAddon={<SearchIcon {...stylex.props(exampleStyles.icon)} />}
      />
    </div>
  )
}

function TimeCombobox({
  ariaLabel,
  id,
  items,
  onChange,
  value,
}: {
  ariaLabel: string
  id: string
  items: string[]
  onChange: (time: string) => void
  value: string
}) {
  return (
    <Combobox
      autoHighlight
      items={items}
      onValueChange={(time) => {
        if (typeof time === "string") {
          onChange(time)
        }
      }}
      value={value}
    >
      <ComboboxTrigger
        aria-label={ariaLabel}
        render={
          <Button
            xstyle={groupItemStyles.item}
            {...stylex.props(exampleStyles.example1)}
            id={id}
            size="sm"
            variant="outline"
          />
        }
      >
        <ComboboxValue />
      </ComboboxTrigger>
      <ComboboxPopup
        aria-label={ariaLabel}
        {...stylex.props(exampleStyles.example2)}
      >
        <TimeSearch />
        <ComboboxEmpty>No times found.</ComboboxEmpty>
        <ComboboxList>
          {(time: string) => (
            <ComboboxItem key={time} value={time}>
              <span {...stylex.props(exampleStyles.example5)}>{time}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

function CopyTimesIcon() {
  return <CopyIcon {...stylex.props(exampleStyles.icon2)} aria-hidden="true" />
}

function CopyDayOptions({
  day,
  onChange,
  value,
}: {
  day: Day
  onChange: (days: string[]) => void
  value: string[]
}) {
  return (
    <CheckboxGroup
      aria-label={`Copy ${day} times to`}
      onValueChange={onChange}
      value={value}
    >
      {days
        .filter((target) => target !== day)
        .map((target) => (
          <Label key={target}>
            <Checkbox value={target} />
            {target}
          </Label>
        ))}
    </CheckboxGroup>
  )
}

function CopyTimesPopover({
  day,
  disabled,
  onCopy,
}: {
  day: Day
  disabled: boolean
  onCopy: (targets: Day[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [selectedDays, setSelectedDays] = useState<string[]>([])

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (nextOpen) {
          setSelectedDays([])
        }
      }}
      open={open}
    >
      <Tooltip disableHoverablePopup>
        <PopoverTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  aria-label={`Copy ${day} times to other days`}
                  disabled={disabled}
                  size="icon-sm"
                  variant="ghost"
                />
              }
            />
          }
        >
          <CopyTimesIcon />
        </PopoverTrigger>
        <TooltipPopup>Copy to other days</TooltipPopup>
      </Tooltip>
      <PopoverPopup align="end" {...stylex.props(exampleStyles.example6)}>
        <div {...stylex.props(exampleStyles.example7)}>
          <div {...stylex.props(exampleStyles.example8)}>Copy times to</div>
          <CopyDayOptions
            day={day}
            onChange={setSelectedDays}
            value={selectedDays}
          />
          <Button
            disabled={selectedDays.length === 0}
            onClick={() => {
              onCopy(selectedDays as Day[])
              setOpen(false)
            }}
            size="sm"
          >
            Apply
          </Button>
        </div>
      </PopoverPopup>
    </Popover>
  )
}

export default function Particle() {
  const id = useId()
  const [availability, setAvailability] =
    useState<Record<Day, TimeRange[]>>(defaultAvailability)

  const setDayRanges = (day: Day, ranges: TimeRange[]) => {
    setAvailability((prev) => ({ ...prev, [day]: ranges }))
  }

  const toggleDay = (day: Day, enabled: boolean) => {
    setDayRanges(day, enabled ? [createRange("9:00 AM", "5:00 PM")] : [])
  }

  const addRange = (day: Day) => {
    const ranges = availability[day]
    const lastRange = ranges[ranges.length - 1]
    if (!lastRange) {
      setDayRanges(day, [createRange("9:00 AM", "5:00 PM")])
      return
    }
    const startIndex = Math.min(
      timeIndex(lastRange.end) + 4,
      timeOptions.length - 2,
    )
    const endIndex = Math.min(startIndex + 4, timeOptions.length - 1)
    setDayRanges(day, [
      ...ranges,
      createRange(timeOptions[startIndex] ?? "", timeOptions[endIndex] ?? ""),
    ])
  }

  const removeRange = (day: Day, id: number) => {
    setDayRanges(
      day,
      availability[day].filter((range) => range.id !== id),
    )
  }

  const updateStart = (day: Day, id: number, start: string) => {
    setDayRanges(
      day,
      availability[day].map((range) => {
        if (range.id !== id) return range
        const end =
          timeIndex(start) >= timeIndex(range.end)
            ? (timeOptions[
                Math.min(timeIndex(start) + 4, timeOptions.length - 1)
              ] ?? range.end)
            : range.end
        return { ...range, end, start }
      }),
    )
  }

  const updateEnd = (day: Day, id: number, end: string) => {
    setDayRanges(
      day,
      availability[day].map((range) =>
        range.id === id ? { ...range, end } : range,
      ),
    )
  }

  const copyTo = (source: Day, targets: Day[]) => {
    setAvailability((prev) => {
      const next = { ...prev }
      for (const target of targets) {
        next[target] = prev[source].map((range) =>
          createRange(range.start, range.end),
        )
      }
      return next
    })
  }

  return (
    <TooltipProvider delay={0}>
      <div>
        {days.map((day, dayIndex) => {
          const ranges = availability[day]
          const lastRange = ranges[ranges.length - 1]
          const addDisabled = lastRange
            ? timeIndex(lastRange.end) >= timeOptions.length - 2
            : false

          return (
            <div
              {...stylex.props(
                exampleStyles.example9,
                dayIndex < days.length - 1 && exampleStyles.report1,
              )}
              key={day}
            >
              <Label {...stylex.props(exampleStyles.example10)}>
                <Switch
                  checked={ranges.length > 0}
                  onCheckedChange={(checked) => toggleDay(day, checked)}
                />
                {day}
              </Label>
              <div {...stylex.props(exampleStyles.example11)}>
                <div {...stylex.props(exampleStyles.example12)}>
                  {ranges.length === 0 ? (
                    <p {...stylex.props(exampleStyles.example13)}>
                      Unavailable
                    </p>
                  ) : (
                    ranges.map((range) => {
                      const startId = `${id}-start-${range.id}`
                      const endId = `${id}-end-${range.id}`

                      return (
                        <div
                          {...stylex.props(exampleStyles.example14)}
                          key={range.id}
                        >
                          <Group aria-label={`${day} time range`}>
                            <GroupText render={<Label htmlFor={startId} />}>
                              From
                            </GroupText>
                            <GroupSeparator />
                            <TimeCombobox
                              ariaLabel={`${day} start time`}
                              id={startId}
                              items={timeOptions}
                              onChange={(start) =>
                                updateStart(day, range.id, start)
                              }
                              value={range.start}
                            />
                            <GroupSeparator />
                            <GroupText render={<Label htmlFor={endId} />}>
                              To
                            </GroupText>
                            <GroupSeparator />
                            <TimeCombobox
                              ariaLabel={`${day} end time`}
                              id={endId}
                              items={timeOptions.slice(
                                timeIndex(range.start) + 1,
                              )}
                              onChange={(end) => updateEnd(day, range.id, end)}
                              value={range.end}
                            />
                          </Group>
                          <Tooltip disableHoverablePopup>
                            <TooltipTrigger
                              render={
                                <Button
                                  aria-label={`Delete ${range.start} to ${range.end} on ${day}`}
                                  onClick={() => removeRange(day, range.id)}
                                  size="icon-sm"
                                  variant="ghost"
                                />
                              }
                            >
                              <XIcon
                                {...stylex.props(exampleStyles.icon2)}
                                aria-hidden="true"
                              />
                            </TooltipTrigger>
                            <TooltipPopup>Delete range</TooltipPopup>
                          </Tooltip>
                        </div>
                      )
                    })
                  )}
                </div>
                <div {...stylex.props(exampleStyles.example15)}>
                  <Tooltip disableHoverablePopup>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-label={`Add time range to ${day}`}
                          disabled={addDisabled}
                          onClick={() => addRange(day)}
                          size="icon-sm"
                          variant="ghost"
                        />
                      }
                    >
                      <PlusIcon
                        {...stylex.props(exampleStyles.icon2)}
                        aria-hidden="true"
                      />
                    </TooltipTrigger>
                    <TooltipPopup>Add range</TooltipPopup>
                  </Tooltip>
                  <CopyTimesPopover
                    day={day}
                    disabled={ranges.length === 0}
                    onCopy={(targets) => copyTo(day, targets)}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

const exampleStyles = stylex.create({
  icon: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
  },
  icon2: {
    blockSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    inlineSize: { default: "1.125rem", "@media (min-width: 640px)": "1rem" },
    flexShrink: 0,
    pointerEvents: "none",
    opacity: 0.8,
    marginInline: "-0.125rem",
  },
  example1: {
    inlineSize: "calc(0.25rem * 24)",
    fontWeight: "400",
    fontVariantNumeric: "   tabular-nums ",
  },
  example2: {
    minInlineSize: "calc(0.25rem * 44)",
  },
  example3: {
    borderBlockEndStyle: "solid",
    borderBlockEndWidth: "1px",
    padding: "calc(0.25rem * 2)",
  },
  example4: {
    borderRadius: "calc(var(--radius) - 2px)",
    "::before": {
      content: '""',
      borderRadius: "calc(calc(var(--radius) - 2px) - 1px)",
    },
  },
  example5: {
    fontVariantNumeric: "   tabular-nums ",
  },
  example6: {
    inlineSize: "calc(0.25rem * 44)",
  },
  example7: {
    display: "flex",
    flexDirection: "column",
    gap: "calc(0.25rem * 3)",
  },
  example8: {
    fontSize: "0.875rem",
    lineHeight: "calc(1.25 / 0.875)",
    fontWeight: "500",
    color: "var(--foreground)",
  },
  example9: {
    display: "flex",
    flexDirection: {
      default: "column",
      "@media (min-width: 48rem)": "row",
    },
    gap: "calc(0.25rem * 4)",
    paddingBlock: "calc(0.25rem * 3)",
    paddingBlockStart: {
      default: null,
      ":first-child": "0px",
    },
    paddingBlockEnd: {
      default: null,
      ":last-child": "0px",
    },
    flexWrap: {
      default: null,
      "@media (min-width: 48rem)": "wrap",
    },
    alignItems: {
      default: null,
      "@media (min-width: 48rem)": "flex-start",
    },
  },
  example10: {
    display: "flex",
    blockSize: {
      default: "calc(0.25rem * 8)",
      "@media (min-width: 40rem)": "calc(0.25rem * 7)",
    },
    inlineSize: "calc(0.25rem * 30)",
    flexShrink: "0",
    alignItems: "center",
    gap: "calc(0.25rem * 2.5)",
  },
  example11: {
    display: "flex",
    inlineSize: "100%",
    minInlineSize: "0px",
    alignItems: "flex-start",
    gap: "calc(0.25rem * 4)",
    flex: {
      default: null,
      "@media (min-width: 48rem)": "1",
    },
  },
  example12: {
    display: "flex",
    minInlineSize: "0px",
    flexDirection: "column",
    gap: "calc(0.25rem * 2)",
  },
  example13: {
    display: "flex",
    blockSize: {
      default: "calc(0.25rem * 8)",
      "@media (min-width: 40rem)": "calc(0.25rem * 7)",
    },
    alignItems: "center",
    color: "var(--muted-foreground)",
    fontSize: {
      default: null,
      "@media (min-width: 40rem)": "0.875rem",
    },
    lineHeight: {
      default: null,
      "@media (min-width: 40rem)": "calc(1.25 / 0.875)",
    },
  },
  example14: {
    display: "flex",
    alignItems: "center",
    gap: "calc(0.25rem * 2)",
  },
  example15: {
    marginInlineStart: "auto",
    display: "flex",
    flexShrink: "0",
    gap: "0.25rem",
  },

  report1: {
    borderBlockEnd: "1px solid var(--border)",
  },
})
