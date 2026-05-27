"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarProps = {
  selected?: Date
  onSelect?: (date: Date) => void
  month?: Date
  onMonthChange?: (date: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}

const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"]

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDay(a?: Date, b?: Date) {
  if (!a || !b) return false
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  disabled,
  className,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState(() => selected || new Date())
  const activeMonth = month || internalMonth
  const days = getCalendarDays(activeMonth)

  const setMonth = (date: Date) => {
    setInternalMonth(date)
    onMonthChange?.(date)
  }

  const goToMonth = (offset: number) => {
    setMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + offset, 1))
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => goToMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold text-foreground">
          {activeMonth.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => goToMonth(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {dayLabels.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const outside = date.getMonth() !== activeMonth.getMonth()
          const selectedDay = isSameDay(date, selected)
          const today = isSameDay(date, new Date())
          const isDisabled = disabled?.(date)

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect?.(date)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40",
                outside && "text-muted-foreground/45",
                today && "bg-muted text-foreground",
                selectedDay && "bg-primary text-primary-foreground hover:bg-primary",
                !selectedDay && "hover:bg-muted hover:text-foreground"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
