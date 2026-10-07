import { X, Pencil, Trash2, Download, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectionBarProps {
  count: number
  onClear: () => void
  onEdit?: () => void
  onDelete?: () => void
  onToggleActive?: () => void
  toggleActiveLabel?: string
  onDownload?: () => void
}

export function SelectionBar({
  count,
  onClear,
  onEdit,
  onDelete,
  onToggleActive,
  toggleActiveLabel = 'Ativar/Inativar',
  onDownload,
}: SelectionBarProps) {
  if (count === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3 bg-muted/60 border border-border rounded-lg px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClear} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
        <span className="font-medium">
          {count} {count === 1 ? 'item selecionado' : 'itens selecionados'}
        </span>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        {onEdit && (
          <Button variant="ghost" size="sm" className="h-8" onClick={onEdit}>
            <Pencil size={14} />
            Editar
          </Button>
        )}
        {onToggleActive && (
          <Button variant="ghost" size="sm" className="h-8" onClick={onToggleActive}>
            <Power size={14} />
            {toggleActiveLabel}
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 size={14} />
            Excluir
          </Button>
        )}
        {onDownload && (
          <Button variant="ghost" size="sm" className="h-8" onClick={onDownload}>
            <Download size={14} />
            Baixar
          </Button>
        )}
      </div>
    </div>
  )
}
