import type { Control } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { AssessmentProposalFormValues } from '@/schemas/assessmentProposal'

type PriorConditionsFieldsProps = {
  control: Control<AssessmentProposalFormValues>
}

export function PriorConditionsFields({ control }: PriorConditionsFieldsProps) {
  const priorConditions = useWatch({ control, name: 'prior_conditions' })

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h4 className="text-sm font-semibold">Doenças prévias</h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Marque condições conhecidas. Para alterações cardíacas, neurológicas ou pulmonares, descreva em texto.
        </p>
      </div>

      {(['hypertension', 'diabetes', 'high_cholesterol'] as const).map((field) => (
        <FormField
          key={field}
          control={control}
          name={`prior_conditions.${field}`}
          render={({ field: f }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <Checkbox checked={Boolean(f.value)} onCheckedChange={f.onChange} />
              </FormControl>
              <FormLabel className="font-normal cursor-pointer">
                {field === 'hypertension' && 'Hipertensão (HAS)'}
                {field === 'diabetes' && 'Diabetes (DM)'}
                {field === 'high_cholesterol' && 'Colesterol alto'}
              </FormLabel>
            </FormItem>
          )}
        />
      ))}

      {(
        [
          ['cardiac_alteration', 'Alteração cardíaca'],
          ['neurological_alteration', 'Alteração neurológica'],
          ['pulmonary_alteration', 'Alteração pulmonar'],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="space-y-2">
          <FormField
            control={control}
            name={`prior_conditions.${key}.present`}
            render={({ field: f }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Checkbox checked={Boolean(f.value)} onCheckedChange={f.onChange} />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">{label}</FormLabel>
              </FormItem>
            )}
          />
          {priorConditions?.[key]?.present && (
            <FormField
              control={control}
              name={`prior_conditions.${key}.details`}
              render={({ field: f }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder={`Descreva a ${label.toLowerCase()} (ex.: IAM 2019, arritmia…)`}
                      {...f}
                      value={f.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      ))}

      <FormField
        control={control}
        name="surgeries"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cirurgias prévias</FormLabel>
            <p className="text-xs text-muted-foreground mb-2">Informe o nome da cirurgia e o ano</p>
            <div className="space-y-2">
              {(field.value ?? []).map((surgery, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <Input
                    placeholder="Ex.: Cesárea"
                    value={surgery.name}
                    onChange={(e) => {
                      const next = [...(field.value ?? [])]
                      next[index] = { ...next[index], name: e.target.value }
                      field.onChange(next)
                    }}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Ano"
                    className="w-24"
                    value={surgery.year || ''}
                    onChange={(e) => {
                      const next = [...(field.value ?? [])]
                      next[index] = { ...next[index], year: Number(e.target.value) || new Date().getFullYear() }
                      field.onChange(next)
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => field.onChange((field.value ?? []).filter((_, i) => i !== index))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.onChange([...(field.value ?? []), { name: '', year: new Date().getFullYear() }])}
              >
                <Plus className="size-4 mr-1" />
                Adicionar cirurgia
              </Button>
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}
