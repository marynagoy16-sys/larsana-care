import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadAcademyMedia } from '@/services/academyAdmin'

interface AcademyMediaUploadFieldProps {
  folder: string
  value?: string | null
  onChange: (url: string) => void
  accept?: string
  label?: string
}

export function AcademyMediaUploadField({
  folder,
  value,
  onChange,
  accept = 'video/mp4,video/webm,application/pdf,image/*',
  label = 'Arquivo de mídia',
}: AcademyMediaUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)
    try {
      const url = await uploadAcademyMedia(file, folder)
      onChange(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
          {uploading ? 'Enviando…' : 'Selecionar arquivo'}
        </Button>
        {value && (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate max-w-xs">
            Arquivo atual
          </a>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
