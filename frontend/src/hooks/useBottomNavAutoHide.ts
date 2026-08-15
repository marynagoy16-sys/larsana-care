import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { usePageFooter } from '@/contexts/PageFooterContext'
import { syncBottomNavCollapsedDataset } from '@/lib/bottomNavCollapse'

const SCROLL_DELTA = 6
const TOP_THRESHOLD = 8
const LAYOUT_COOLDOWN_MS = 350

function resolveScrollElement(target: RefObject<HTMLElement | null> | HTMLElement | null) {
  if (!target) return null
  if ('current' in target) return target.current
  return target
}

export function useBottomNavAutoHide(
  scrollTarget: RefObject<HTMLElement | null> | HTMLElement | null,
  enabled = true,
) {
  const { setBottomNavCollapsed } = usePageFooter()
  const lastScrollTop = useRef(0)
  const collapsedRef = useRef(false)
  const ignoreScrollUntil = useRef(0)

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (collapsedRef.current === next) return
      collapsedRef.current = next
      ignoreScrollUntil.current = performance.now() + LAYOUT_COOLDOWN_MS
      syncBottomNavCollapsedDataset(next)
      setBottomNavCollapsed(next)
    },
    [setBottomNavCollapsed],
  )

  useEffect(() => {
    if (!enabled) return

    const element = resolveScrollElement(scrollTarget)
    if (!element) return

    lastScrollTop.current = element.scrollTop

    let frame = 0

    const onScroll = () => {
      if (performance.now() < ignoreScrollUntil.current) return

      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (performance.now() < ignoreScrollUntil.current) return

        const top = element.scrollTop
        const delta = top - lastScrollTop.current

        if (top <= TOP_THRESHOLD) {
          setCollapsed(false)
        } else if (delta > SCROLL_DELTA) {
          setCollapsed(true)
        } else if (delta < -SCROLL_DELTA) {
          setCollapsed(false)
        }

        lastScrollTop.current = top
      })
    }

    element.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', onScroll)
    }
  }, [enabled, scrollTarget, setCollapsed])
}
