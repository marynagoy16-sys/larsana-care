import { motion } from 'framer-motion'
import { usePageFooter } from '@/contexts/PageFooterContext'

export function DataLayerFooter() {
  const { footer } = usePageFooter()

  if (!footer?.content) return null

  return (
    <footer
      className="shrink-0 mt-auto z-20 mx-[var(--shell-gap)] border border-border/70 bg-card rounded-t-xl px-4 py-3 shadow-sm"
      aria-label="Rodapé da página"
    >
      {footer.loading ? (
        footer.content
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {footer.content}
        </motion.div>
      )}
    </footer>
  )
}
