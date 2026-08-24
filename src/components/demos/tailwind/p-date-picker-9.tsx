"use client";

import type { DateRange } from "@daypicker/react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/tailwind/button";
import { Calendar } from "@/components/ui/tailwind/calendar";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
} from "@/components/ui/tailwind/popover";

export default function Particle() {
  const [date, setDate] = useState<DateRange | undefined>();

  return (
    <Popover>
      <PopoverTrigger
        render={<Button className="w-full justify-start" variant="outline" />}
      >
        <CalendarIcon aria-hidden="true" />
        {date?.from ? (
          date.to ? (
            <>
              {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
            </>
          ) : (
            format(date.from, "LLL dd, y")
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </PopoverTrigger>
      <PopoverPopup>
        <Calendar
          defaultMonth={date?.from}
          mode="range"
          numberOfMonths={2}
          onSelect={setDate}
          selected={date}
        />
      </PopoverPopup>
    </Popover>
  );
}
