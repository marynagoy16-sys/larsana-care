export const PRICING_DRAWER_SHEET_CLASS =
  'w-full sm:max-w-2xl lg:max-w-[920px] p-0 gap-0 overflow-hidden [&>button]:hidden flex flex-col h-full border-l border-border/80 shadow-2xl'

export const PRICING_DRAWER_TABS = [
  { id: 'prices', label: 'Preços por sessão' },
  { id: 'commissions', label: 'Repasses' },
  { id: 'retention', label: 'Taxa 1º mês' },
] as const

export type PricingDrawerTabId = (typeof PRICING_DRAWER_TABS)[number]['id']
