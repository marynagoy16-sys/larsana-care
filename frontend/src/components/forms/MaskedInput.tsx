import { Input } from '@/components/ui/input'
import { applyMask, type MaskType } from '@/lib/masks'
import type { ComponentProps } from 'react'

interface MaskedInputProps extends Omit<ComponentProps<typeof Input>, 'onChange'> {
  mask: MaskType
  value: string
  onChange: (value: string) => void
}

export function MaskedInput({ mask, value, onChange, ...props }: MaskedInputProps) {
  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => onChange(applyMask(mask, e.target.value))}
    />
  )
}
