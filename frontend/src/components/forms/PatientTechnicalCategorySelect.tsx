import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ppTechnicalCategorySelectOptions } from '@/lib/ppTechnicalCategories'

interface PatientTechnicalCategorySelectProps {
  value: string | null | undefined
  onValueChange: (value: string | null) => void
  disabled?: boolean
}

export function PatientTechnicalCategorySelect({
  value,
  onValueChange,
  disabled,
}: PatientTechnicalCategorySelectProps) {
  return (
    <Select
      value={value ?? '__none__'}
      onValueChange={(next) => onValueChange(next === '__none__' ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecione a categoria técnica" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">Não classificado</SelectItem>
        {ppTechnicalCategorySelectOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
