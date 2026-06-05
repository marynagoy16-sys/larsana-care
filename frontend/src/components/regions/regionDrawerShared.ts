export const REGION_DRAWER_SHEET_CLASS =
  'w-full sm:max-w-2xl lg:max-w-3xl xl:max-w-4xl p-0 gap-0 overflow-hidden [&>button]:hidden flex flex-col h-full border-l border-border/80 shadow-2xl'

export function normalizeLocalityName(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR')
}
