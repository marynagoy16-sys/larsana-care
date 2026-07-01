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
  demand: { patient_addresses?: { full_address?: string | null; neighborhood?: string | null } | null; patients?: { patient_addresses?: Array<{ full_address?: string | null; neighborhood?: string | null; is_primary?: boolean }> | null; cities?: { name?: string | null } | null } | null },
  demandType: 'avaliacao' | 'continuidade',
): string {
  const address = demand.patient_addresses ?? demand.patients?.patient_addresses?.find((a) => a.is_primary) ?? demand.patients?.patient_addresses?.[0] ?? null
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
