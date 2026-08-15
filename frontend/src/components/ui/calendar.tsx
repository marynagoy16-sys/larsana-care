import { DayPicker, getDefaultClassNames, type DayPickerProps } from 'react-day-picker'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={ptBR}
      className={cn('p-1', className)}
      classNames={{
        ...defaults,
        months: cn('relative flex flex-col gap-2', defaults.months, classNames?.months),
        month: cn('flex flex-col gap-3', defaults.month, classNames?.month),
        month_caption: cn('flex items-center justify-center gap-2 px-1', defaults.month_caption, classNames?.month_caption),
        dropdowns: cn('flex items-center gap-2 text-sm font-medium', defaults.dropdowns, classNames?.dropdowns),
        dropdown: cn('rounded-md border border-input bg-background px-2 py-1', defaults.dropdown, classNames?.dropdown),
        weekdays: cn('flex', defaults.weekdays, classNames?.weekdays),
        weekday: cn('w-9 text-center text-xs font-medium text-muted-foreground', defaults.weekday, classNames?.weekday),
        week: cn('mt-1 flex w-full', defaults.week, classNames?.week),
        day: cn('relative p-0 text-center', defaults.day, classNames?.day),
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-normal transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'aria-selected:bg-primary aria-selected:text-primary-foreground',
          defaults.day_button,
          classNames?.day_button,
        ),
        selected: cn('bg-primary text-primary-foreground', defaults.selected, classNames?.selected),
        today: cn('font-semibold text-primary', defaults.today, classNames?.today),
        outside: cn('text-muted-foreground/40', defaults.outside, classNames?.outside),
        disabled: cn('text-muted-foreground/30', defaults.disabled, classNames?.disabled),
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
