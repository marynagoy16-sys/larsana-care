import { useRouter } from 'expo-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Alert, ScrollView, Text, TextInput, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { MonthPicker } from '@/components/ui/DatePicker'
import { Button } from '@/components/ui/Button'
import { internalExpensesService } from '@/services/expenses'
import { formatCentsInput, getCurrentMonthKey, parseCurrencyToCents } from '@/lib/formatters'
import { useState } from 'react'

const schema = z.object({
  expense_type: z.string().min(1, 'Informe o tipo da despesa'),
  amount_cents: z.number().positive('Informe um valor maior que zero'),
  reference_month: z.string().regex(/^\d{4}-\d{2}$/, 'Informe o mês de referência'),
})

type FormValues = z.infer<typeof schema>

export default function NovaDespesaScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [amountDisplay, setAmountDisplay] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      expense_type: '',
      amount_cents: 0,
      reference_month: getCurrentMonthKey(),
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => internalExpensesService.create(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] })
      void queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] })
      Alert.alert('Sucesso', 'Despesa registrada.', [{ text: 'OK', onPress: () => router.back() }])
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  })

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Nova despesa" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-5 pb-8" keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          <Text className="text-sm font-medium text-muted-foreground">Tipo</Text>
          <Controller
            control={control}
            name="expense_type"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                placeholder="Ex: Aluguel, Material..."
                placeholderTextColor="#49796B"
                className="h-12 rounded-xl border border-border bg-card px-4 text-base text-foreground"
              />
            )}
          />
          {errors.expense_type ? (
            <Text className="text-sm text-destructive">{errors.expense_type.message}</Text>
          ) : null}
        </View>

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
                placeholderTextColor="#49796B"
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
          name="reference_month"
          render={({ field: { value, onChange } }) => (
            <MonthPicker value={value} onChange={onChange} label="Mês de referência" />
          )}
        />
        {errors.reference_month ? (
          <Text className="text-sm text-destructive">{errors.reference_month.message}</Text>
        ) : null}

        <Button loading={createMutation.isPending} onPress={() => void handleSubmit((v) => createMutation.mutate(v))()}>
          Salvar despesa
        </Button>
      </ScrollView>
    </View>
  )
}
