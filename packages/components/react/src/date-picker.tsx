import * as React from "react"
import {
  DatePicker as DatePickerPrimitive,
  type DatePickerValueChangeDetails,
} from "@ark-ui/react/date-picker"
import { Portal } from "@ark-ui/react/portal"
import { Icon } from "@yopem-ui/react-icons"
import { cn } from "@yopem-ui/utils"

interface DatePickerProps
  extends React.ComponentProps<typeof DatePickerPrimitive.Root> {
  label?: string
  handleOnValueChange?: (value: DatePickerValueChangeDetails) => void
}

export const DatePicker = ({
  label,
  value,
  handleOnValueChange,
  name,
  disabled,
  className,
  ...props
}: DatePickerProps) => {
  return (
    <DatePickerPrimitive.Root
      value={value}
      name={name}
      onValueChange={handleOnValueChange}
      disabled={disabled}
      {...props}
    >
      {label && (
        <DatePickerPrimitive.Label className="text-muted-foreground mb-1 block text-sm font-medium">
          {label}
        </DatePickerPrimitive.Label>
      )}
      <DatePickerPrimitive.Control
        className={cn(
          "border-input bg-background focus-within:ring-ring flex items-center gap-2 rounded-xl border p-2 shadow-sm focus-within:ring-2",
          className,
        )}
      >
        <DatePickerPrimitive.Input
          name={name}
          className="flex-1 bg-transparent outline-none"
        />
        <DatePickerPrimitive.Trigger
          className="text-muted-foreground hover:text-primary transition"
          asChild
        >
          <Icon name="Calendar" className="size-4" />
        </DatePickerPrimitive.Trigger>
        <DatePickerPrimitive.ClearTrigger
          className="text-muted-foreground ml-1 text-xs hover:underline"
          asChild
        >
          <Icon name="Trash" className="size-4" />
        </DatePickerPrimitive.ClearTrigger>
      </DatePickerPrimitive.Control>

      <Portal>
        <DatePickerPrimitive.Positioner className="z-50">
          <DatePickerPrimitive.Content className="bg-popover animate-in fade-in-0 zoom-in-95 w-auto max-w-sm rounded-2xl border p-4 shadow-xl">
            <DatePickerPrimitive.YearSelect className="mb-2" />
            <DatePickerPrimitive.MonthSelect className="mb-2" />
            <DatePickerPrimitive.View view="day">
              <DatePickerPrimitive.Context>
                {(api) => (
                  <>
                    <DatePickerPrimitive.ViewControl className="mb-2 flex items-center justify-between">
                      <DatePickerPrimitive.PrevTrigger className="hover:bg-muted rounded px-2 py-1 text-sm">
                        Prev
                      </DatePickerPrimitive.PrevTrigger>
                      <DatePickerPrimitive.ViewTrigger className="text-sm font-medium">
                        <DatePickerPrimitive.RangeText />
                      </DatePickerPrimitive.ViewTrigger>
                      <DatePickerPrimitive.NextTrigger className="hover:bg-muted rounded px-2 py-1 text-sm">
                        Next
                      </DatePickerPrimitive.NextTrigger>
                    </DatePickerPrimitive.ViewControl>
                    <DatePickerPrimitive.Table>
                      <DatePickerPrimitive.TableHead>
                        <DatePickerPrimitive.TableRow>
                          {api.weekDays.map((day, i) => (
                            <DatePickerPrimitive.TableHeader
                              key={i}
                              className="text-muted-foreground text-center text-xs"
                            >
                              {day.short}
                            </DatePickerPrimitive.TableHeader>
                          ))}
                        </DatePickerPrimitive.TableRow>
                      </DatePickerPrimitive.TableHead>
                      <DatePickerPrimitive.TableBody>
                        {api.weeks.map((week, i) => (
                          <DatePickerPrimitive.TableRow key={i}>
                            {week.map((day, j) => (
                              <DatePickerPrimitive.TableCell
                                key={j}
                                value={day}
                              >
                                <DatePickerPrimitive.TableCellTrigger className="hover:bg-muted h-8 w-8 rounded-md text-sm transition">
                                  {day.day}
                                </DatePickerPrimitive.TableCellTrigger>
                              </DatePickerPrimitive.TableCell>
                            ))}
                          </DatePickerPrimitive.TableRow>
                        ))}
                      </DatePickerPrimitive.TableBody>
                    </DatePickerPrimitive.Table>
                  </>
                )}
              </DatePickerPrimitive.Context>
            </DatePickerPrimitive.View>
          </DatePickerPrimitive.Content>
        </DatePickerPrimitive.Positioner>
      </Portal>
    </DatePickerPrimitive.Root>
  )
}
