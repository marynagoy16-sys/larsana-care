/** Paleta oficial LarsanaCare — fonte única para referência em código */
export const larsanaPalette = {
  /** Verde Lar Profundo — texto, contraste, hover de CTAs */
  deep: '#042C21',
  /** Verde Cuidado — botões, ícones ativos, links */
  care: '#095742',
  /** Ouro — destaques, badges, acentos premium */
  gold: '#B8A266',
  /** Linho Sereno — superfícies secundárias, bordas suaves */
  linen: '#EDEAE4',
  /** Branco Acolhimento — fundo principal */
  white: '#FCFBF7',
  /** Verde muted — ícones inativos, placeholders */
  muted: '#49796B',
} as const

/** Tokens HSL (formato shadcn: `H S% L%`) */
export const larsanaHsl = {
  brandLight: '48 45.5% 97.8%',
  brandDark: '163.5 83.3% 9.4%',
  brandCare: '163.8 81.3% 18.8%',
  brandGold: '43.9 36.6% 56.1%',
  brandLinen: '40 20% 91.2%',
  mutedForeground: '163 25% 38%',
  navActiveBg: '163 35% 90%',
} as const
