/**
 * No celular, o Safari/Chrome desloca o viewport de layout quando um campo
 * recebe foco e o teclado abre. O app rola por dentro do shell (`overflow: auto`),
 * então esse deslocamento do documento não volta quando o teclado fecha:
 * o formulário sobe e a barra fixa (Salvar avaliação) fica fora da tela.
 * Aqui o documento fica travado e, se o offset grudar, o shell é reposicionado
 * na área visível. O campo focado rola só dentro do scroller interno.
 */

const LOCK_CLASS = 'app-viewport-lock'
const SHIFTED_CLASS = 'vv-shifted'
const OFFSET_VAR = '--vv-offset-top'
const MOBILE_QUERY = '(max-width: 1023px)'
const PAN_THRESHOLD_PX = 40
const FIELD_ANCHOR_PX = 80
const VIEW_MARGIN_PX = 16
const KEYBOARD_GAP_PX = 80
const HEIGHT_VAR = '--app-height'

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

const OBSTRUCTION_SELECTOR =
  '[data-shell-action-bar], .content-fixed-footer, nav[aria-label="Navegação principal"]'

/** Altura do shell com o teclado fechado. `null` enquanto o teclado está aberto. */
export function shellHeightOverride(innerHeight: number, visualHeight: number): number | null {
  if (!Number.isFinite(innerHeight) || !Number.isFinite(visualHeight) || visualHeight <= 0) return null
  if (innerHeight - visualHeight > KEYBOARD_GAP_PX) return null
  return Math.round(visualHeight)
}

export function stuckViewportOffset(offsetTop: number, scale: number): number {
  if (!Number.isFinite(offsetTop) || !Number.isFinite(scale)) return 0
  if (Math.abs(scale - 1) > 0.01) return 0
  if (offsetTop <= PAN_THRESHOLD_PX) return 0
  return Math.round(offsetTop)
}

/** Quanto o scroller interno precisa andar para o campo ficar na área visível. */
export function computeScrollDelta(input: {
  fieldTop: number
  fieldBottom: number
  visibleTop: number
  visibleBottom: number
  margin?: number
}): number {
  const margin = input.margin ?? VIEW_MARGIN_PX
  const topLimit = input.visibleTop + margin
  const bottomLimit = input.visibleBottom - margin
  if (!(bottomLimit > topLimit)) return 0

  const top = input.fieldTop
  const anchorBottom = Math.min(input.fieldBottom, top + FIELD_ANCHOR_PX)
  if (top < topLimit) return top - topLimit
  if (anchorBottom > bottomLimit) return anchorBottom - bottomLimit
  return 0
}

export function isKeyboardEditable(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return !target.disabled
  if (target instanceof HTMLInputElement) {
    if (target.disabled) return false
    return !NON_TEXT_INPUT_TYPES.has(target.type)
  }
  return false
}

export function setAppViewportLock(locked: boolean) {
  const root = document.documentElement
  root.classList.toggle(LOCK_CLASS, locked)
  if (!locked) clearViewportOverrides()
}

function clearViewportOverrides() {
  const root = document.documentElement
  root.classList.remove(SHIFTED_CLASS)
  root.style.removeProperty(OFFSET_VAR)
  root.style.removeProperty(HEIGHT_VAR)
}

function isLocked() {
  return document.documentElement.classList.contains(LOCK_CLASS) && window.matchMedia(MOBILE_QUERY).matches
}

function resetDocumentScroll() {
  if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0)
  const scrolling = document.scrollingElement
  if (scrolling && (scrolling.scrollTop !== 0 || scrolling.scrollLeft !== 0)) {
    scrolling.scrollTop = 0
    scrolling.scrollLeft = 0
  }
  if (document.body.scrollTop !== 0 || document.body.scrollLeft !== 0) {
    document.body.scrollTop = 0
    document.body.scrollLeft = 0
  }
}

function applyStuckOffset(vv: VisualViewport) {
  const root = document.documentElement
  const offset = stuckViewportOffset(vv.offsetTop, vv.scale)
  if (!offset) {
    if (root.classList.contains(SHIFTED_CLASS) || root.style.getPropertyValue(OFFSET_VAR)) {
      root.classList.remove(SHIFTED_CLASS)
      root.style.removeProperty(OFFSET_VAR)
    }
    return
  }
  const next = `${offset}px`
  if (root.style.getPropertyValue(OFFSET_VAR) !== next) root.style.setProperty(OFFSET_VAR, next)
  root.classList.add(SHIFTED_CLASS)
}

function syncShellHeight(vv: VisualViewport) {
  const root = document.documentElement
  const next = shellHeightOverride(window.innerHeight, vv.height)
  if (next == null) {
    if (root.style.getPropertyValue(HEIGHT_VAR)) root.style.removeProperty(HEIGHT_VAR)
    return
  }
  const value = `${next}px`
  if (root.style.getPropertyValue(HEIGHT_VAR) !== value) root.style.setProperty(HEIGHT_VAR, value)
}

function findScrollableAncestor(element: HTMLElement): HTMLElement | null {
  let fallback: HTMLElement | null = null
  let node = element.parentElement
  while (node && node !== document.body && node !== document.documentElement) {
    const { overflowY } = getComputedStyle(node)
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      fallback ??= node
      if (node.scrollHeight > node.clientHeight + 1) return node
    }
    node = node.parentElement
  }
  return fallback
}

function visibleBounds(vv: VisualViewport): { top: number; bottom: number } {
  let top = 0
  const header = document.querySelector<HTMLElement>('.shell-mobile-header')
  if (header) {
    const style = getComputedStyle(header)
    if (style.display !== 'none' && style.visibility !== 'hidden') {
      const rect = header.getBoundingClientRect()
      if (rect.height > 0 && rect.bottom > 0) top = rect.bottom
    }
  }

  let bottom = vv.height
  for (const node of document.querySelectorAll<HTMLElement>(OBSTRUCTION_SELECTOR)) {
    const style = getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') continue
    const rect = node.getBoundingClientRect()
    if (rect.height < 1 || rect.top >= bottom - 4) continue
    if (rect.top > vv.height * 0.45) bottom = Math.min(bottom, rect.top)
  }
  return { top, bottom }
}

function revealFocusedField(vv: VisualViewport) {
  const active = document.activeElement
  if (!isKeyboardEditable(active)) return
  const scroller = findScrollableAncestor(active)
  if (!scroller) return
  const rect = active.getBoundingClientRect()
  const bounds = visibleBounds(vv)
  const delta = computeScrollDelta({
    fieldTop: rect.top,
    fieldBottom: rect.bottom,
    visibleTop: bounds.top,
    visibleBottom: bounds.bottom,
  })
  if (Math.abs(delta) < 1) return
  scroller.scrollTop += delta
}

function syncViewport(vv: VisualViewport) {
  if (!isLocked()) {
    clearViewportOverrides()
    return
  }
  resetDocumentScroll()
  applyStuckOffset(vv)
  syncShellHeight(vv)
  revealFocusedField(vv)
}

export function installMobileKeyboardViewportFix(): () => void {
  const vv = window.visualViewport
  if (!vv) return () => {}

  let generation = 0
  let frame = 0
  const timers = new Set<number>()
  const mq = window.matchMedia(MOBILE_QUERY)

  const later = (delay: number, token: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.delete(id)
      if (token !== generation) return
      fn()
    }, delay)
    timers.add(id)
  }

  const schedule = () => {
    if (!isLocked() && !document.documentElement.classList.contains(SHIFTED_CLASS)) return
    const token = ++generation
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (token !== generation) return
      syncViewport(vv)
      requestAnimationFrame(() => {
        if (token !== generation || !isLocked()) return
        revealFocusedField(vv)
      })
    })
  }

  const onFocusOut = () => {
    if (!isLocked()) return
    const token = ++generation
    // O WebKit aplica o offset residual depois do blur, às vezes em mais de um frame.
    for (const delay of [50, 150, 400]) later(delay, token, () => syncViewport(vv))
  }

  const onMqChange = () => {
    if (!mq.matches) clearViewportOverrides()
  }

  vv.addEventListener('resize', schedule)
  vv.addEventListener('scroll', schedule)
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('orientationchange', schedule)
  document.addEventListener('focusin', schedule)
  document.addEventListener('focusout', onFocusOut)
  mq.addEventListener('change', onMqChange)

  return () => {
    cancelAnimationFrame(frame)
    for (const id of timers) window.clearTimeout(id)
    timers.clear()
    vv.removeEventListener('resize', schedule)
    vv.removeEventListener('scroll', schedule)
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('orientationchange', schedule)
    document.removeEventListener('focusin', schedule)
    document.removeEventListener('focusout', onFocusOut)
    mq.removeEventListener('change', onMqChange)
    clearViewportOverrides()
  }
}
