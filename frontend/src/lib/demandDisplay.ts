import type { DemandDetail } from '@/services/demands'

function resolvePrimaryAddress(demand: DemandDetail) {
  if (demand.patient_addresses?.full_address) return demand.patient_addresses
  const addresses = demand.patients?.patient_addresses ?? []
  return addresses.find((item) => item.is_primary) ?? addresses[0] ?? null
}

export function formatDemandLevelRegion(
  patientLevel: string | null | undefined,
  regionCode: string | null | undefined,
): string {
  const levelNumber = patientLevel?.replace(/^N/i, '') ?? '—'
  const region = regionCode?.toUpperCase() ?? '—'
  if (levelNumber === '—' && region === '—') return '—'
  return `NÍVEL ${levelNumber} | REGIÃO ${region}`
}

export function formatDemandLocation(
  demand: DemandDetail,
  demandType: 'avaliacao' | 'continuidade',
): string {
  const address = resolvePrimaryAddress(demand)
  const city = demand.patients?.cities?.name?.trim() ?? ''
  const neighborhood = address?.neighborhood?.trim() ?? ''
  const neighborhoodLabel = neighborhood.replace(/^bairro\s+/i, '')

  if (city && neighborhood) {
    if (demandType === 'avaliacao') {
      return `${city.toUpperCase()} — BAIRRO ${neighborhoodLabel.toUpperCase()}`
    }
    return `${neighborhood} — ${city}`
  }

  return address?.full_address?.trim() || '—'
}
