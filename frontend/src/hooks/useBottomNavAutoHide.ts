import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { usePageFooter } from '@/contexts/PageFooterContext'
import { syncBottomNavCollapsedDataset } from '@/lib/bottomNavCollapse'

const SCROLL_DELTA = 6
const TOP_THRESHOLD = 8
const LAYOUT_COOLDOWN_MS = 350
/** Conteúdo precisa rolar o suficiente para valer esconder a bottom nav. */
const MIN_SCROLLABLE_TO_COLLAPSE = 72

function resolveScrollElement(target: RefObject<HTMLElement | null> | HTMLElement | null) {
  if (!target) return null
  if ('current' in target) return target.current
  return target
}

function getMaxScroll(element: HTMLElement) {
  return Math.max(0, element.scrollHeight - element.clientHeight)
}

export function useBottomNavAutoHide(
  scrollTarget: RefObject<HTMLElement | null> | HTMLElement | null,
  enabled = true,
) {
  const { setBottomNavCollapsed } = usePageFooter()
  const lastScrollTop = useRef(0)
  const collapsedRef = useRef(false)
  const ignoreScrollUntil = useRef(0)

  const reconcileAfterLayout = useCallback(
    (element: HTMLElement) => {
      const maxScroll = getMaxScroll(element)

      if (element.scrollTop > maxScroll) {
        element.scrollTop = maxScroll
      }

      const top = element.scrollTop
      lastScrollTop.current = top

      if (top <= TOP_THRESHOLD || maxScroll <= TOP_THRESHOLD || maxScroll < MIN_SCROLLABLE_TO_COLLAPSE) {
        if (collapsedRef.current) {
          collapsedRef.current = false
          syncBottomNavCollapsedDataset(false)
          setBottomNavCollapsed(false)
        }
      }
    },
    [setBottomNavCollapsed],
  )

  const setCollapsed = useCallback(
    (next: boolean) => {
      if (collapsedRef.current === next) return
      collapsedRef.current = next
      ignoreScrollUntil.current = performance.now() + LAYOUT_COOLDOWN_MS
      syncBottomNavCollapsedDataset(next)
      setBottomNavCollapsed(next)

      if (next) {
        window.setTimeout(() => {
          const element = resolveScrollElement(scrollTarget)
          if (element) reconcileAfterLayout(element)
        }, LAYOUT_COOLDOWN_MS + 20)
      }
    },
    [reconcileAfterLayout, scrollTarget, setBottomNavCollapsed],
  )

  useEffect(() => {
    if (!enabled) {
      if (collapsedRef.current) {
        collapsedRef.current = false
        syncBottomNavCollapsedDataset(false)
        setBottomNavCollapsed(false)
      }
      return
    }

    const element = resolveScrollElement(scrollTarget)
    if (!element) return

    lastScrollTop.current = element.scrollTop
    reconcileAfterLayout(element)

    let frame = 0

    const onScroll = () => {
      if (performance.now() < ignoreScrollUntil.current) return

      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (performance.now() < ignoreScrollUntil.current) return

        const top = element.scrollTop
        const maxScroll = getMaxScroll(element)

        if (maxScroll < MIN_SCROLLABLE_TO_COLLAPSE || top <= TOP_THRESHOLD) {
          setCollapsed(false)
          lastScrollTop.current = top
          return
        }

        const delta = top - lastScrollTop.current

        if (delta > SCROLL_DELTA) {
          setCollapsed(true)
        } else if (delta < -SCROLL_DELTA) {
          setCollapsed(false)
        }

        lastScrollTop.current = top
      })
    }

    const onResize = () => {
      if (performance.now() < ignoreScrollUntil.current) return
      reconcileAfterLayout(element)
    }

    element.addEventListener('scroll', onScroll, { passive: true })
    const resizeObserver = new ResizeObserver(onResize)
    resizeObserver.observe(element)

    return () => {
      cancelAnimationFrame(frame)
      element.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [enabled, reconcileAfterLayout, scrollTarget, setBottomNavCollapsed, setCollapsed])
}
