import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SearchCombobox } from '@/components/forms/SearchCombobox'
import { PatientPreviewDrawer } from '@/components/patients/PatientPreviewDrawer'
import { Button } from '@/components/ui/button'
import { getPatientSearchOption, searchPatients } from '@/services/entitySearch'

interface PatientSearchFieldProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  showCreate?: boolean
}

export function PatientSearchField({
  value,
  onChange,
  disabled,
  showCreate = true,
}: PatientSearchFieldProps) {
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <div className="space-y-2">
      <SearchCombobox
        value={value}
        onValueChange={onChange}
        onSearch={searchPatients}
        resolveOption={getPatientSearchOption}
        placeholder="Buscar paciente por nome ou CPF…"
        emptyMessage="Nenhum paciente encontrado"
        disabled={disabled}
      />
      {showCreate && !disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={14} />
          Cadastrar novo paciente
        </Button>
      )}
      <PatientPreviewDrawer
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(patientId) => {
          setCreateOpen(false)
          onChange(patientId)
        }}
      />
    </div>
  )
}
