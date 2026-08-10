export const PLAN_COLORS: Record<string, string> = {
  T1: '#059669',
  T2: '#0284c7',
  T3: '#7c3aed',
  T4: '#d97706',
  T5: '#e11d48',
}

export function getPlanColor(code: string): string {
  return PLAN_COLORS[code] ?? '#095742'
}
