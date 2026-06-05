export interface CsvColumn<T> {
  header: string
  value: (row: T) => string | number | null | undefined
}

export function exportToCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
  if (rows.length === 0) return

  const escape = (val: string | number | null | undefined) => {
    const str = String(val ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const header = columns.map((c) => escape(c.header)).join(',')
  const body = rows.map((row) => columns.map((c) => escape(c.value(row))).join(',')).join('\n')
  const csv = `\uFEFF${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
