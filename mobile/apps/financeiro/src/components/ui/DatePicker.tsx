import { Pressable, Text, TextInput, View } from 'react-native'
import { Calendar } from 'lucide-react-native'

function toDisplayValue(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function toIsoValue(display: string): string {
  const digits = display.replace(/\D/g, '')
  if (digits.length !== 8) return display
  const d = digits.slice(0, 2)
  const m = digits.slice(2, 4)
  const y = digits.slice(4, 8)
  return `${y}-${m}-${d}`
}

export function DatePicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (iso: string) => void
  label?: string
}) {
  const display = toDisplayValue(value)

  const handleChange = (text: string) => {
    const masked = text
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3')
      .slice(0, 10)

    if (masked.length === 10) {
      onChange(toIsoValue(masked))
    } else {
      onChange(masked)
    }
  }

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-muted-foreground">{label}</Text> : null}
      <View className="relative">
        <View className="absolute left-3 top-3.5">
          <Calendar size={18} color="#5A7920" />
        </View>
        <TextInput
          value={display}
          onChangeText={handleChange}
          placeholder="DD/MM/AAAA"
          placeholderTextColor="#5A7920"
          keyboardType="numeric"
          className="h-12 rounded-xl border border-border bg-card pl-10 pr-4 text-base text-foreground"
        />
      </View>
    </View>
  )
}

export function MonthPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (monthKey: string) => void
  label?: string
}) {
  const display = value.length === 7 ? `${value.slice(5, 7)}/${value.slice(0, 4)}` : value

  const handleChange = (text: string) => {
    const masked = text
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1/$2')
      .slice(0, 7)

    if (masked.length === 7) {
      const [m, y] = masked.split('/')
      onChange(`${y}-${m}`)
    } else {
      onChange(masked)
    }
  }

  return (
    <View className="gap-2">
      {label ? <Text className="text-sm font-medium text-muted-foreground">{label}</Text> : null}
      <Pressable>
        <TextInput
          value={display}
          onChangeText={handleChange}
          placeholder="MM/AAAA"
          placeholderTextColor="#5A7920"
          keyboardType="numeric"
          className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground"
        />
      </Pressable>
    </View>
  )
}
