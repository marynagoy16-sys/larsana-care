import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { toast } from 'sonner'
import type { BulkImportResult } from '@/services/bulkImport'
import { parseImportCsvFile } from '@/services/bulkImport'

type Props = {
  title: string
  description: string
  templateCsv: string
  templateFilename: string
  importFn: (rows: Record<string, string>[]) => Promise<BulkImportResult>
}

export function AdminImportPage({ title, description, templateCsv, templateFilename, importFn }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [lastResult, setLastResult] = useState<BulkImportResult | null>(null)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const rows = parseImportCsvFile(text)
      if (!rows.length) throw new Error('Arquivo vazio ou sem linhas de dados.')
      return importFn(rows)
    },
    onSuccess: (result) => {
      setLastResult(result)
      if (result.errors?.length) {
        toast.warning(`${result.created} importados · ${result.errors.length} erros`)
      } else {
        toast.success(`${result.created} registros importados com sucesso`)
      }
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

  return (
    <>
      <PageHeader>
        <h1 className="font-display font-bold text-xl">{title}</h1>
      </PageHeader>

      <CrudScrollPageLayout>
        <div className="space-y-6 pb-8 max-w-2xl">
          <p className="text-sm text-muted-foreground">{description}</p>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">Modelo CSV</h2>
            <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">{templateCsv}</pre>
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="size-4 mr-2" />
              Baixar modelo
            </Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">Importar planilha</h2>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importMutation.mutate(file)
                e.target.value = ''
              }}
            />
            <Button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={importMutation.isPending}
            >
              <Upload className="size-4 mr-2" />
              {importMutation.isPending ? 'Importando…' : 'Selecionar CSV'}
            </Button>
          </section>

          {lastResult && lastResult.errors?.length > 0 ? (
            <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-2">
              <h2 className="font-semibold text-sm text-destructive">Erros por linha</h2>
              <ul className="text-xs space-y-2 max-h-64 overflow-y-auto">
                {lastResult.errors.map((err) => (
                  <li key={err.row} className="rounded-md bg-background/80 p-2 border border-border">
                    <span className="font-medium">Linha {err.row}:</span> {err.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
