import type { Control } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { patientLevelLabels, weeklyFrequencyLabels, proposedSessionCountLabels } from '@/constants/labels'
import type { AssessmentProposalFormValues } from '@/schemas/assessmentProposal'
import {
  PROPOSAL_PATIENT_LEVELS,
  PROPOSAL_SESSION_COUNTS,
  PROPOSAL_WEEKLY_FREQUENCIES,
} from '@/schemas/assessmentProposal'

type AssessmentProposalFieldsProps = {
  control: Control<AssessmentProposalFormValues>
  showLevelChangeReason: boolean
}

export function AssessmentProposalFields({
  control,
  showLevelChangeReason,
}: AssessmentProposalFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="proposed_weekly_frequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Frequência semanal sugerida</FormLabel>
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a frequência" />
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
            <FormLabel>Ciclo proposto</FormLabel>
            <Select
              value={String(field.value)}
              onValueChange={(v) => field.onChange(Number(v))}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ciclo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PROPOSAL_SESSION_COUNTS.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {proposedSessionCountLabels[count]}
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
        name="proposed_patient_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nível do paciente</FormLabel>
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {PROPOSAL_PATIENT_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {patientLevelLabels[level]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {showLevelChangeReason && (
        <FormField
          control={control}
          name="patient_level_change_reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justificativa da alteração de nível</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Ex.: Por que o paciente passou de Nível 1 para Nível 2?"
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
        name="comorbidities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Comorbidades</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Comorbidades relevantes (opcional)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="mobility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mobilidade</FormLabel>
            <FormControl>
              <Textarea
                rows={3}
                placeholder="Ex.: Deambula com andador, acamado, transferência com auxílio..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="crefito_number"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Número CREFITO</FormLabel>
            <FormControl>
              <Textarea rows={1} placeholder="Ex.: 308315-F" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="clinical_content"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Laudo complementar (opcional)</FormLabel>
            <FormControl>
              <Textarea
                rows={5}
                placeholder="Observações adicionais da avaliação clínica..."
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
