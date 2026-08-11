import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { PatientHomeBanner } from '@/components/paciente/PatientHomeBanner'
import { PatientHomeHelpLink, PatientHomeLarsanaPillTeaser } from '@/components/paciente/PatientHomeExtras'
import { PatientHomeJourney } from '@/components/paciente/PatientHomeJourney'
import { PatientActiveTreatmentCard } from '@/components/paciente/PatientActiveTreatmentCard'
import { loadPatientHome, patientPortalQueryKeys } from '@/services/patientPortal'

export default function InicioScreen() {
  const { data, isLoading, isError } = useQuery({
    queryKey: patientPortalQueryKeys.home,
    queryFn: loadPatientHome,
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['bottom']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView className="flex-1 bg-background px-4" edges={['bottom']}>
        <Text className="mt-6 text-muted-foreground">Não foi possível carregar sua página inicial.</Text>
      </SafeAreaView>
    )
  }

  if (!data.linkedPatient) {
    return (
      <SafeAreaView className="flex-1 bg-background px-4" edges={['bottom']}>
        <ScrollView contentContainerClassName="gap-4 py-4">
          <View className="rounded-xl border border-dashed border-border p-8">
            <Text className="text-center font-medium text-foreground">Nenhum paciente vinculado à sua conta</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Entre em contato com a Larsana para vincular o responsável ao paciente.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 py-4 pb-28">
        <PatientHomeBanner context={data} />
        {!data.pendingProposal && !data.pendingCharge && !data.latestAssessment && !data.activeCycle ? (
          <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6">
            <Text className="text-center text-sm text-muted-foreground">
              Em breve você verá aqui o andamento do tratamento e avisos importantes.
            </Text>
          </View>
        ) : null}
        {data.activeCycle ? (
          <PatientActiveTreatmentCard
            cycle={data.activeCycle}
            professionalNameFallback={data.linkedPatient.professionalName}
            featured
          />
        ) : null}
        {(data.latestAssessment || data.activeCycle) ? <PatientHomeJourney context={data} /> : null}
        <PatientHomeLarsanaPillTeaser patientId={data.linkedPatient.patientId} />
        <PatientHomeHelpLink />
      </ScrollView>
    </SafeAreaView>
  )
}
