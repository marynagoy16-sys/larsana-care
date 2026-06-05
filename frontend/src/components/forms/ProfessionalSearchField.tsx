import { useCallback } from 'react'
import { SearchCombobox } from '@/components/forms/SearchCombobox'
import {
  getProfessionalSearchOption,
  searchProfessionals,
  type ProfessionalSearchFilters,
} from '@/services/entitySearch'

interface ProfessionalSearchFieldProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  filters?: ProfessionalSearchFilters
}

export function ProfessionalSearchField({
  value,
  onChange,
  disabled,
  filters,
}: ProfessionalSearchFieldProps) {
  const handleSearch = useCallback(
    (query: string) => searchProfessionals(query, filters),
    [filters],
  )

  return (
    <SearchCombobox
      value={value}
      onValueChange={onChange}
      onSearch={handleSearch}
      resolveOption={getProfessionalSearchOption}
      placeholder="Buscar profissional por nome…"
      emptyMessage="Nenhum profissional encontrado"
      disabled={disabled}
    />
  )
}
