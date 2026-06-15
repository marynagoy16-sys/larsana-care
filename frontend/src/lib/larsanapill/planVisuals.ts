export const PLAN_GRADIENTS: Record<string, string> = {
  T1: 'from-emerald-600 to-teal-900',
  T2: 'from-sky-600 to-blue-900',
  T3: 'from-violet-600 to-purple-900',
  T4: 'from-amber-500 to-orange-800',
  T5: 'from-rose-600 to-red-900',
}

export function getPlanGradient(code: string): string {
  return PLAN_GRADIENTS[code] ?? 'from-primary to-primary/80'
}
