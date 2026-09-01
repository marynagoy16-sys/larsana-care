import type { Control } from 'react-hook-form'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/formatters'
import { weeklyFrequencyLabels, proposedSessionCountLabels } from '@/constants/labels'
import type { AssessmentProposalFormValues } from '@/schemas/assessmentProposal'
import {
  PROPOSAL_WEEKLY_FREQUENCIES,
  sessionCountForWeeklyFrequency,
  type ProposalSessionCount,
  type ProposalWeeklyFrequency,
} from '@/schemas/assessmentProposal'
import { PriorConditionsFields } from '@/components/assessments/PriorConditionsFields'

type AssessmentProposalFieldsProps = {
  control: Control<AssessmentProposalFormValues>
  suggestedLevelLabel: string
  showLevelChangeReason: boolean
  estimatedRepasseTotalCents?: number | null
  ppFullName?: string | null
  crefitoReadonly?: string | null
}

export function AssessmentProposalFields({
  control,
  suggestedLevelLabel,
  showLevelChangeReason,
  estimatedRepasseTotalCents,
  ppFullName,
  crefitoReadonly,
}: AssessmentProposalFieldsProps) {
  const { setValue } = useFormContext<AssessmentProposalFormValues>()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="proposed_weekly_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequência semanal sugerida</FormLabel>
              <Select
                value={String(field.value)}
                onValueChange={(v) => {
                  const frequency = Number(v) as ProposalWeeklyFrequency
                  field.onChange(frequency)
                  setValue('proposed_session_count', sessionCountForWeeklyFrequency(frequency), {
                    shouldValidate: true,
                  })
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROPOSAL_WEEKLY_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq} value={String(freq)}>
                      {weeklyFrequencyLabels[freq]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="proposed_session_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ciclo</FormLabel>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground min-h-10 flex items-center">
                {proposedSessionCountLabels[field.value as ProposalSessionCount] ??
                  `${field.value} terapias`}
              </div>
              <p className="text-xs text-muted-foreground">
                Serão realizadas {field.value} terapias para que o pagamento seja efetivado.
              </p>
              {estimatedRepasseTotalCents != null ? (
                <p className="text-xs font-medium text-foreground">
                  Repasse estimado: {formatCurrency(estimatedRepasseTotalCents)}
                  <span className="font-normal text-muted-foreground">
                    {' '}
                    (se todas as terapias forem realizadas pelo mesmo profissional parceiro)
                  </span>
                </p>
              ) : null}
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 space-y-3">
        <div>
          <p className="text-sm font-medium">Nível sugerido pela Larsana</p>
          <p className="text-muted-foreground text-sm mt-0.5">{suggestedLevelLabel}</p>
        </div>
        <FormField
          control={control}
          name="level_confirmed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Você confirma que este paciente é {suggestedLevelLabel}?</FormLabel>
              <FormControl>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={field.value ? 'default' : 'outline'}
                    onClick={() => field.onChange(true)}
                  >
                    Sim
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!field.value ? 'default' : 'outline'}
                    className={cn(!field.value && 'border-amber-500')}
                    onClick={() => field.onChange(false)}
                  >
                    Não
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showLevelChangeReason && (
        <FormField
          control={control}
          name="patient_level_change_reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificativa — por que o nível sugerido não se aplica?</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Descreva por que acredita que o paciente deveria ter outro nível. A gestão Larsana analisará."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="functionality"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Funcionalidade</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Ex.: Deambula com andador, acamado, transferência com auxílio…"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <PriorConditionsFields control={control} />

      <FormField
        control={control}
        name="primary_diagnosis"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Diagnóstico principal</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="Diagnóstico principal identificado na avaliação" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="patient_occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profissão do paciente</FormLabel>
            <FormControl>
              <Textarea rows={1} placeholder="Ex.: aposentado, autônomo, estudante…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {(ppFullName || crefitoReadonly) ? (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-3">
          {ppFullName ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Profissional responsável (CREFITO)</p>
              <p className="font-medium">{ppFullName}</p>
            </div>
          ) : null}
          <FormField
            control={control}
            name="crefito_number"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs font-normal text-muted-foreground">Número CREFITO</FormLabel>
                <FormControl>
                  <>
                    <input type="hidden" {...field} value={crefitoReadonly ?? field.value} />
                    <p className="font-medium">{crefitoReadonly ?? field.value}</p>
                  </>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : (
        <FormField
          control={control}
          name="crefito_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número CREFITO</FormLabel>
              <FormControl>
                <Textarea rows={1} readOnly className="bg-muted resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        control={control}
        name="clinical_content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Avaliação clínica</FormLabel>
            <FormControl>
              <Textarea
                rows={6}
                placeholder="Descreva em texto corrido como foi a avaliação, conduta e observações clínicas…"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
