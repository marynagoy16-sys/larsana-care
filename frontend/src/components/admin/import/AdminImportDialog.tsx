import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { BulkImportResult } from '@/services/bulkImport'
import {
  parseImportFile,
  prepareImportRows,
  previewImportRows,
  type ImportKind,
} from '@/services/bulkImport'

type AdminImportDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  templateCsv: string
  templateFilename: string
  importKind: ImportKind
  importFn: (rows: Record<string, string>[]) => Promise<BulkImportResult>
  onSuccess?: () => void
}

export function AdminImportDialog({
  open,
  onOpenChange,
  title,
  description,
  templateCsv,
  templateFilename,
  importKind,
  importFn,
  onSuccess,
}: AdminImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastResult, setLastResult] = useState<BulkImportResult | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null)
  const [pendingRows, setPendingRows] = useState<Record<string, string>[] | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)

  const resetState = () => {
    setLastResult(null)
    setPreview(null)
    setPendingRows(null)
    setPendingFileName(null)
  }

  const importMutation = useMutation({
    mutationFn: async (rows: Record<string, string>[]) => {
      if (!rows.length) throw new Error('Arquivo vazio ou sem linhas de dados.')
      return importFn(rows)
    },
    onSuccess: (result) => {
      setLastResult(result)
      setPreview(null)
      setPendingRows(null)
      setPendingFileName(null)
      onSuccess?.()
      if (result.errors?.length) {
        toast.warning(`${result.created} importados · ${result.errors.length} erros`)
      } else {
        toast.success(`${result.created} registros importados com sucesso`)
        onOpenChange(false)
        resetState()
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const parseMutation = useMutation({
    mutationFn: async (file: File) => {
      const rawRows = await parseImportFile(file)
      const rows = prepareImportRows(importKind, rawRows)
      if (!rows.length) throw new Error('Arquivo vazio ou sem linhas de dados.')
      return { rows, fileName: file.name }
    },
    onSuccess: ({ rows, fileName }) => {
      setPendingRows(rows)
      setPendingFileName(fileName)
      setPreview(previewImportRows(rows))
      setLastResult(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const downloadTemplate = () => {
    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = templateFilename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const previewHeaders = preview?.length ? Object.keys(preview[0]) : []

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetState()
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem))] w-[calc(100vw-2rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1.5 border-b border-border px-6 py-4 text-left">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm">Modelo CSV</h2>
            <pre className="text-xs bg-muted rounded-lg p-3 overflow-hidden whitespace-pre-wrap break-all">{templateCsv}</pre>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="size-4 mr-2" />
              Baixar modelo
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-semibold text-sm">Selecionar planilha</h2>
            <p className="text-xs text-muted-foreground">
              Aceita <strong>.csv</strong> ou <strong>.xlsx</strong>. CPF, datas Excel e enums legados são normalizados
              automaticamente.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) parseMutation.mutate(file)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={parseMutation.isPending || importMutation.isPending}
            >
              <Upload className="size-4 mr-2" />
              {parseMutation.isPending ? 'Lendo arquivo…' : 'Selecionar CSV ou XLSX'}
            </Button>
          </section>

          {preview && pendingRows ? (
            <section className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="space-y-1">
                <h2 className="font-semibold text-sm">Pré-visualização ({pendingFileName})</h2>
                <p className="text-xs text-muted-foreground">
                  {pendingRows.length} linha(s) · exibindo as primeiras {preview.length}
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border bg-background max-h-48">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {previewHeaders.map((header) => (
                        <th key={header} className="px-2 py-2 text-left font-medium whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className="border-b border-border/60">
                        {previewHeaders.map((header) => (
                          <td key={header} className="px-2 py-2 whitespace-nowrap max-w-[180px] truncate">
                            {row[header] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => importMutation.mutate(pendingRows)}
                  disabled={importMutation.isPending}
                >
                  {importMutation.isPending ? 'Importando…' : `Confirmar (${pendingRows.length})`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPreview(null)
                    setPendingRows(null)
                    setPendingFileName(null)
                  }}
                  disabled={importMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </section>
          ) : null}

          {lastResult && lastResult.errors?.length > 0 ? (
            <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
              <h2 className="font-semibold text-sm text-destructive">Erros por linha</h2>
              <ul className="text-xs space-y-2 max-h-40 overflow-y-auto">
                {lastResult.errors.map((err) => (
                  <li key={err.row} className="rounded-md bg-background/80 p-2 border border-border">
                    <span className="font-medium">Linha {err.row}:</span> {err.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
