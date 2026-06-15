import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface QuizQuestionForm {
  question: string
  options: string[]
  correctIndex: number
}

interface QuizQuestionsEditorProps {
  questions: QuizQuestionForm[]
  onChange: (questions: QuizQuestionForm[]) => void
}

export function QuizQuestionsEditor({ questions, onChange }: QuizQuestionsEditorProps) {
  const update = (index: number, patch: Partial<QuizQuestionForm>) => {
    onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)))
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const q = questions[qIndex]
    const options = [...q.options]
    options[oIndex] = value
    update(qIndex, { options })
  }

  const addOption = (qIndex: number) => {
    const q = questions[qIndex]
    update(qIndex, { options: [...q.options, ''] })
  }

  const add = () => onChange([...questions, { question: '', options: ['', ''], correctIndex: 0 }])
  const remove = (index: number) => onChange(questions.filter((_, i) => i !== index))

  return (
    <div className="space-y-4">
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Pergunta {qIndex + 1}</p>
            <Button type="button" variant="ghost" size="sm" className="text-destructive h-7" onClick={() => remove(qIndex)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input placeholder="Pergunta" value={q.question} onChange={(e) => update(qIndex, { question: e.target.value })} />
          <div className="space-y-1">
            {q.options.map((opt, oIndex) => (
              <div key={oIndex} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qIndex}`}
                  checked={q.correctIndex === oIndex}
                  onChange={() => update(qIndex, { correctIndex: oIndex })}
                />
                <Input
                  className="flex-1"
                  placeholder={`Opção ${oIndex + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                />
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => addOption(qIndex)}>
              + opção
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={add}>
        <Plus className="mr-1 h-4 w-4" /> Adicionar pergunta
      </Button>
    </div>
  )
}
