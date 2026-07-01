import { useState } from 'react'
import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { PatientSearchField } from '@/components/financeiro/PatientSearchField'
import { DatePicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/Button'
import { edgeFunctions } from '@/services/edgeFunctions'
import type { PatientSearchResult } from '@/services/patients'
import { formatCentsInput, parseCurrencyToCents } from '@/lib/formatters'

const schema = z.object({
  patient_id: z.string().min(1, 'Selecione um paciente'),
  amount_cents: z.number().positive('Informe um valor maior que zero'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data de vencimento'),
  payment_method: z.enum(['PIX', 'BOLETO']),
})

type FormValues = z.infer<typeof schema>

export default function NovaCobrancaScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [patient, setPatient] = useState<PatientSearchResult | null>(null)
  const [amountDisplay, setAmountDisplay] = useState('')

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: '',
      amount_cents: 0,
      due_date: '',
      payment_method: 'PIX',
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => edgeFunctions.createCharge(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['charges'] })
      void queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] })
      Alert.alert('Sucesso', 'Cobrança criada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (e: Error) => Alert.alert('Erro', e.message ?? 'Falha ao criar cobrança.'),
  })

  const onSubmit = handleSubmit((values) => createMutation.mutate(values))

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Nova cobrança" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 pb-8" keyboardShouldPersistTaps="handled">
        <PatientSearchField
          value={patient}
          onSelect={(p) => {
            setPatient(p)
            setValue('patient_id', p?.id ?? '', { shouldValidate: true })
          }}
          error={errors.patient_id?.message}
        />

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Valor</Text>
          <Controller
            control={control}
            name="amount_cents"
            render={({ field: { onChange } }) => (
              <TextInput
                value={amountDisplay}
                onChangeText={(text) => {
                  const cents = parseCurrencyToCents(text)
                  setAmountDisplay(formatCentsInput(cents))
                  onChange(cents)
                }}
                keyboardType="numeric"
                placeholder="R$ 0,00"
                placeholderTextColor="#5A7920"
                className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground"
              />
            )}
          />
          {errors.amount_cents ? (
            <Text className="text-sm text-destructive">{errors.amount_cents.message}</Text>
          ) : null}
        </View>

        <Controller
          control={control}
          name="due_date"
          render={({ field: { value, onChange } }) => (
            <DatePicker value={value} onChange={onChange} label="Vencimento" />
          )}
        />
        {errors.due_date ? <Text className="text-sm text-destructive">{errors.due_date.message}</Text> : null}

        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Método de pagamento</Text>
          <Controller
            control={control}
            name="payment_method"
            render={({ field: { value, onChange } }) => (
              <View className="flex-row gap-2">
                {(['PIX', 'BOLETO'] as const).map((method) => (
                  <Pressable
                    key={method}
                    onPress={() => onChange(method)}
                    className={`flex-1 items-center rounded-xl border py-3 ${
                      value === method ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    }`}
                  >
                    <Text className={`font-semibold ${value === method ? 'text-primary' : 'text-muted-foreground'}`}>
                      {method}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          />
        </View>

        <Button loading={createMutation.isPending} onPress={() => void onSubmit()}>
          Criar cobrança
        </Button>
      </ScrollView>
    </View>
  )
}
