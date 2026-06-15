import { useQuery } from '@tanstack/react-query'
import { Award, Download } from 'lucide-react'
import { PageSkeleton } from '@/components/shared/PageSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getProfessionalId } from '@/services/academy'
import { edgeFunctions } from '@/services/edgeFunctions'
import { formatDateTime } from '@/lib/formatters'

export function AcademyCertificatesPage() {
  const { data: professionalId } = useQuery({
    queryKey: ['pp', 'professional-id'],
    queryFn: getProfessionalId,
  })

  const { data: certificates, isLoading, refetch } = useQuery({
    queryKey: ['pp', 'academy', 'certificates', professionalId],
    queryFn: async () => {
      const { data: enrollments, error: enrollError } = await supabase
        .from('academy_enrollments')
        .select('id')
        .eq('professional_id', professionalId!)
      if (enrollError) throw enrollError
      const enrollmentIds = (enrollments ?? []).map((e) => e.id)
      if (enrollmentIds.length === 0) return []

      const { data, error } = await supabase
        .from('academy_certificates')
        .select('id, enrollment_id, storage_path, issued_at')
        .in('enrollment_id', enrollmentIds)
        .order('issued_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: Boolean(professionalId),
  })

  const handleGenerate = async (enrollmentId: string) => {
    await edgeFunctions.generateAcademyCertificate({ enrollment_id: enrollmentId })
    refetch()
  }

  const { data: completedEnrollments } = useQuery({
    queryKey: ['pp', 'academy', 'completed-enrollments', professionalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academy_enrollments')
        .select('id, course_id')
        .eq('professional_id', professionalId!)
        .eq('status', 'completed')
      if (error) throw error
      return (data ?? []) as Array<{ id: string; course_id: string }>
    },
    enabled: Boolean(professionalId),
  })

  if (isLoading) return <PageSkeleton />

  const certEnrollmentIds = new Set((certificates ?? []).map((c) => c.enrollment_id))

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-24 md:p-6">
      <div>
        <h1 className="font-display text-xl font-bold">Certificados</h1>
        <p className="text-sm text-muted-foreground">Certificados emitidos ao concluir a Formação PP.</p>
      </div>

      {(certificates ?? []).length === 0 && (completedEnrollments ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Conclua a Formação PP para receber seu certificado.</p>
      )}

      <div className="space-y-3">
        {(certificates ?? []).map((cert) => (
          <Card key={cert.id}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <Award className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Formação PP</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(String(cert.issued_at))}</p>
                </div>
              </div>
              {cert.storage_path && (
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <a href={cert.storage_path} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-1 h-4 w-4" /> PDF
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {(completedEnrollments ?? [])
          .filter((e) => !certEnrollmentIds.has(e.id))
          .map((enrollment) => (
            <Card key={enrollment.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">Formação PP</p>
                  <p className="text-xs text-muted-foreground">Curso concluído — gere seu certificado</p>
                </div>
                <Button size="sm" className="rounded-full" onClick={() => handleGenerate(enrollment.id)}>
                  Gerar certificado
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
