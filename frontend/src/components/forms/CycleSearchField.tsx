import { useCallback } from 'react'
import { SearchCombobox } from '@/components/forms/SearchCombobox'
import { getCareCycleSearchOption, searchCareCycles } from '@/services/entitySearch'

interface CycleSearchFieldProps {
  value?: string
  onChange: (value: string) => void
  patientId?: string
  disabled?: boolean
}

export function CycleSearchField({ value, onChange, patientId, disabled }: CycleSearchFieldProps) {
  const handleSearch = useCallback(
    (query: string) => searchCareCycles(query, patientId),
    [patientId],
  )

  return (
    <SearchCombobox
      value={value}
      onValueChange={onChange}
      onSearch={handleSearch}
      resolveOption={getCareCycleSearchOption}
      placeholder="Buscar ciclo por paciente ou número…"
      emptyMessage="Nenhum ciclo encontrado"
      disabled={disabled}
    />
  )
}
