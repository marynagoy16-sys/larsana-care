export const BOTTOM_NAV_COLLAPSED_ATTR = 'data-bottom-nav-collapsed'

export function syncBottomNavCollapsedDataset(collapsed: boolean) {
  if (collapsed) {
    document.documentElement.setAttribute(BOTTOM_NAV_COLLAPSED_ATTR, 'true')
  } else {
    document.documentElement.removeAttribute(BOTTOM_NAV_COLLAPSED_ATTR)
  }
}
