import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRegions } from '@/hooks/queries/useRegions'
import { cn } from '@/lib/utils'

interface RegionSelectFieldProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function RegionSelectField({ value, onChange, disabled, className }: RegionSelectFieldProps) {
  const { data: regions = [], isLoading } = useRegions()

  return (
    <Select onValueChange={onChange} value={value} disabled={disabled || isLoading}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={isLoading ? 'Carregando…' : 'Selecione a região'} />
      </SelectTrigger>
      <SelectContent>
        {regions.map((region) => (
          <SelectItem key={region.id} value={region.id}>
            {region.code} — {region.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
