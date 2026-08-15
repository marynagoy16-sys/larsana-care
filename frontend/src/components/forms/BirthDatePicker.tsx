import { useMemo, useState } from 'react'
import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import 'react-day-picker/style.css'

function parseValue(value: string): Date | undefined {
  if (!value) return undefined
  const date = value.includes('T') ? parseISO(value) : parseISO(`${value}T12:00:00`)
  return isValid(date) ? date : undefined
}

interface BirthDatePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  id?: string
  className?: string
}

export function BirthDatePicker({
  value,
  onChange,
  disabled,
  id,
  className,
}: BirthDatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => parseValue(value), [value])
  const currentYear = new Date().getFullYear()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-11 w-full justify-start rounded-xl border-input bg-background px-3 text-left font-normal',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 size-4 shrink-0 opacity-70" />
          {selected
            ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            : 'Selecione a data de nascimento'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(format(date, 'yyyy-MM-dd'))
            setOpen(false)
          }}
          captionLayout="dropdown"
          fromYear={1920}
          toYear={currentYear}
          defaultMonth={selected ?? new Date(currentYear - 40, 0, 1)}
          disabled={{ after: new Date() }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

export function formatBirthDateLabel(value: string): string {
  const date = parseValue(value)
  if (!date) return ''
  return format(date, 'dd/MM/yyyy', { locale: ptBR })
}
