function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = element.parentElement
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1) {
      return node
    }
    node = node.parentElement
  }
  return null
}

/** Rola o mínimo necessário para manter o card expandido visível acima da bottom nav. */
export function scrollAccordionCardIntoView(element: HTMLElement, bottomInset = 112) {
  const scroller = findScrollableAncestor(element)
  if (!scroller) return

  const rect = element.getBoundingClientRect()
  const scrollerRect = scroller.getBoundingClientRect()
  const viewportBottom = Math.min(window.innerHeight, scrollerRect.bottom) - bottomInset
  const topInset = scrollerRect.top + 8

  if (rect.bottom > viewportBottom) {
    scroller.scrollBy({ top: rect.bottom - viewportBottom + 12, behavior: 'smooth' })
    return
  }

  if (rect.top < topInset) {
    scroller.scrollBy({ top: rect.top - topInset, behavior: 'smooth' })
  }
}
