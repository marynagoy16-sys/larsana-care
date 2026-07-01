import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  careStatusLabels,
  patientCareStatusSelectOptions,
} from '@/lib/patientCareStatus'

interface PatientCareStatusSelectProps {
  value: string
  onValueChange: (value: string) => void
}

const groupedOptions = patientCareStatusSelectOptions.reduce<
  Record<string, (typeof patientCareStatusSelectOptions)[number][]>
>((acc, option) => {
  acc[option.group] = acc[option.group] ?? []
  acc[option.group].push(option)
  return acc
}, {})

export function PatientCareStatusSelect({ value, onValueChange }: PatientCareStatusSelectProps) {
  const displayValue = careStatusLabels[value] ? value : 'ATIVO'

  return (
    <Select onValueChange={onValueChange} value={displayValue}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o status" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(groupedOptions).map(([group, options]) => (
          <SelectGroup key={group}>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {group === 'Em pausa' ? `Em pausa · ${option.label}` : option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        {value === 'PAUSA' && (
          <SelectItem value="PAUSA">{careStatusLabels.PAUSA}</SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}
