import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ExerciseStep } from '@/types/academy'

interface ExerciseStepsEditorProps {
  steps: ExerciseStep[]
  onChange: (steps: ExerciseStep[]) => void
}

export function ExerciseStepsEditor({ steps, onChange }: ExerciseStepsEditorProps) {
  const update = (index: number, patch: Partial<ExerciseStep>) => {
    onChange(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const add = () => onChange([...steps, { title: '', instruction: '', durationSeconds: 30 }])
  const remove = (index: number) => onChange(steps.filter((_, i) => i !== index))

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Passo {index + 1}</p>
            <Button type="button" variant="ghost" size="sm" className="text-destructive h-7" onClick={() => remove(index)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input placeholder="Título" value={step.title} onChange={(e) => update(index, { title: e.target.value })} />
          <Textarea
            placeholder="Instrução"
            rows={2}
            value={step.instruction}
            onChange={(e) => update(index, { instruction: e.target.value })}
          />
          <Input
            type="number"
            min={5}
            placeholder="Duração (seg)"
            value={step.durationSeconds}
            onChange={(e) => update(index, { durationSeconds: Number(e.target.value) })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> Adicionar passo
      </Button>
    </div>
  )
}
