import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavSection as NavSectionType } from '@/config/navigation'
import { SIDEBAR_NAV_ITEM } from '@/components/layout/NavItem'
import { NavSubmenuLink } from '@/components/layout/NavSubmenuLink'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function isRouteActive(pathname: string, href: string, end?: boolean) {
  if (end) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function sectionIsActive(section: NavSectionType, pathname: string) {
  return section.items.some((item) => isRouteActive(pathname, item.href, item.end))
}

interface NavSectionProps {
  section: NavSectionType
  onItemClick?: () => void
  collapsed?: boolean
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NavSection({
  section,
  onItemClick,
  collapsed,
  isOpen: controlledOpen,
  onOpenChange,
}: NavSectionProps) {
  const { pathname } = useLocation()
  const hasActiveItem = sectionIsActive(section, pathname)
  const [localOpen, setLocalOpen] = useState(hasActiveItem)
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined
  const isOpen = isControlled ? controlledOpen : localOpen
  const SectionIcon = section.icon ?? section.items[0]?.icon

  const setOpen = (open: boolean) => {
    if (isControlled) onOpenChange!(open)
    else setLocalOpen(open)
  }

  useEffect(() => {
    if (hasActiveItem) setOpen(true)
  }, [hasActiveItem, pathname])

  const toggleOpen = () => setOpen(!isOpen)

  if (collapsed && SectionIcon) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={section.title}
            aria-label={section.title}
            className={cn(
              SIDEBAR_NAV_ITEM,
              'w-full px-1.5 text-sm transition-colors',
              hasActiveItem
                ? 'bg-nav-active-bg text-nav-active-fg shadow-sm'
                : 'text-muted-foreground hover:bg-nav-hover-bg hover:text-foreground',
            )}
          >
            <SectionIcon
              size={18}
              className={cn(
                'shrink-0',
                hasActiveItem ? 'text-nav-icon' : 'text-nav-icon-muted',
              )}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" sideOffset={8} className="min-w-[11rem]">
          <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {section.title}
          </DropdownMenuLabel>
          {section.items.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <NavLink
                to={item.href}
                end={item.end}
                onClick={onItemClick}
                className={({ isActive }) =>
                  cn(isActive && 'bg-nav-active-bg text-nav-active-fg font-medium')
                }
              >
                {item.label}
              </NavLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={isOpen}
        className={cn(
          SIDEBAR_NAV_ITEM,
          'w-full justify-start gap-3 px-3 text-sm transition-colors',
          hasActiveItem
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-nav-hover-bg hover:text-foreground',
        )}
      >
        {SectionIcon && (
          <SectionIcon
            size={18}
            className={cn('shrink-0', hasActiveItem ? 'text-nav-icon' : 'text-nav-icon-muted')}
          />
        )}
        <span className="flex-1 truncate text-left font-medium">{section.title}</span>
        <ChevronRight
          size={16}
          className={cn(
            'shrink-0 text-muted-foreground/70 transition-transform duration-200',
            isOpen && 'rotate-90',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-1 py-0.5">
            {section.items.map((item) => (
              <NavSubmenuLink
                key={item.href}
                to={item.href}
                label={item.label}
                comingSoon={item.comingSoon}
                end={item.end}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
