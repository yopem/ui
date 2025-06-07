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
          "dark:bg-input/30 border-input focus-within:border-ring focus-within:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex h-9 w-full min-w-0 items-center gap-2 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-within:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
            <DatePickerPrimitive.View view="day">
              <DatePickerPrimitive.Context>
                {(api) => (
                  <>
                    <DatePickerPrimitive.ViewControl className="mb-2 flex items-center justify-between">
                      <DatePickerPrimitive.PrevTrigger className="hover:bg-muted text-muted-foreground rounded p-1 transition">
                        <Icon name="ChevronLeft" className="size-4" />
                      </DatePickerPrimitive.PrevTrigger>
                      <div className="mb-2 flex justify-center gap-2">
                        <DatePickerPrimitive.MonthSelect className="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-2 py-1 text-sm shadow-sm focus-visible:ring-2" />
                        <DatePickerPrimitive.YearSelect className="border-input bg-background focus-visible:ring-ring/50 h-8 rounded-md border px-2 py-1 text-sm shadow-sm focus-visible:ring-2" />
                      </div>
                      <DatePickerPrimitive.NextTrigger className="hover:bg-muted text-muted-foreground rounded p-1 transition">
                        <Icon name="ChevronRight" className="size-4" />
                      </DatePickerPrimitive.NextTrigger>
                    </DatePickerPrimitive.ViewControl>

                    <DatePickerPrimitive.Table>
                      <DatePickerPrimitive.TableHead>
                        <DatePickerPrimitive.TableRow>
                          {api.weekDays.map((day, i) => (
                            <DatePickerPrimitive.TableHeader
                              key={i}
                              className="text-muted-foreground text-center text-[0.65rem] font-medium"
                            >
                              {day.short}
                            </DatePickerPrimitive.TableHeader>
                          ))}
                        </DatePickerPrimitive.TableRow>
                      </DatePickerPrimitive.TableHead>
                      <DatePickerPrimitive.TableBody>
                        {api.weeks.map((week, i) => (
                          <DatePickerPrimitive.TableRow key={i}>
                            {week.map((day, j) => {
                              const visibleRange = api.visibleRange
                              return (
                                <DatePickerPrimitive.TableCell
                                  key={j}
                                  value={day}
                                >
                                  <DatePickerPrimitive.TableCellTrigger
                                    className={cn(
                                      "flex h-9 w-9 items-center justify-center rounded-md text-sm transition-colors",
                                      "hover:bg-muted",
                                      day.month === visibleRange.start.month
                                        ? "text-foreground"
                                        : "text-muted-foreground",
                                      "aria-selected:bg-primary aria-selected:text-primary-foreground",
                                    )}
                                  >
                                    {day.day}
                                  </DatePickerPrimitive.TableCellTrigger>
                                </DatePickerPrimitive.TableCell>
                              )
                            })}
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
