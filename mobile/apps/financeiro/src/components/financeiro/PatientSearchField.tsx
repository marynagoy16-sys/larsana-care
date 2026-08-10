import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { searchPatients, type PatientSearchResult } from '@/services/patients'
import { cn } from '@/lib/cn'

export function PatientSearchField({
  value,
  onSelect,
  label = 'Paciente',
  error,
}: {
  value: PatientSearchResult | null
  onSelect: (patient: PatientSearchResult | null) => void
  label?: string
  error?: string
}) {
  const [query, setQuery] = useState(value?.full_name ?? '')
  const [results, setResults] = useState<PatientSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (value?.full_name && value.full_name !== query) {
      setQuery(value.full_name)
    }
  }, [value])

  useEffect(() => {
    if (!focused || query.trim().length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const rows = await searchPatients(query)
        setResults(rows)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, focused])

  const handleSelect = (patient: PatientSearchResult) => {
    onSelect(patient)
    setQuery(patient.full_name)
    setFocused(false)
    setResults([])
  }

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
      <TextInput
        value={query}
        onChangeText={(text) => {
          setQuery(text)
          if (!text) onSelect(null)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
        placeholder="Buscar paciente por nome"
        placeholderTextColor="#49796B"
        className={cn(
          'h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground',
          error && 'border-destructive',
        )}
      />
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      {focused && (loading || results.length > 0) ? (
        <View className="max-h-48 overflow-hidden rounded-xl border border-border bg-card">
          {loading ? (
            <View className="items-center py-4">
              <ActivityIndicator color="#095742" />
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled">
              {results.map((patient) => (
                <Pressable
                  key={patient.id}
                  onPress={() => handleSelect(patient)}
                  className="border-b border-border/50 px-4 py-3 active:bg-muted/40"
                >
                  <Text className="text-sm text-foreground">{patient.full_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      ) : null}
    </View>
  )
}
