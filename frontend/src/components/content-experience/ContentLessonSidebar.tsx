import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Play } from 'lucide-react'
import { getContentIcon } from '@/lib/content/contentIcons'
import { getGroupProgress } from '@/lib/content/lessonNavigation'
import type { ContentPlayerGroup } from '@/types/academy'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ContentLessonSidebarProps {
  title: string
  groups: ContentPlayerGroup[]
  activeItemId: string
  activeIndex: number
  total: number
  onSelectItem: (itemId: string) => void
  completedItemIds?: Set<string>
}

function ModuleStatusBadge({
  total,
  status,
  percent,
}: {
  total: number
  status: 'pending' | 'in_progress' | 'completed'
  percent: number
}) {
  if (total === 0) return null
  if (status === 'completed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
        <Check className="h-3.5 w-3.5" />
      </span>
    )
  }
  if (status === 'in_progress') {
    const radius = 10
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference
    return (
      <span className="relative flex h-6 w-6 items-center justify-center">
        <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r={radius} fill="none" className="stroke-muted" strokeWidth="2" />
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            className="stroke-primary"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-[8px] font-medium tabular-nums">{percent}%</span>
      </span>
    )
  }
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground tabular-nums">
      {total} {total === 1 ? 'item' : 'itens'}
    </span>
  )
}

function GroupAccordion({
  group,
  activeItemId,
  openGroups,
  onOpenChange,
  onSelectItem,
  completedItemIds,
}: {
  group: ContentPlayerGroup
  activeItemId: string
  openGroups: string[]
  onOpenChange: (groupId: string, open: boolean) => void
  onSelectItem: (itemId: string) => void
  completedItemIds: Set<string>
}) {
  const items = [...group.items].sort((a, b) => a.sortOrder - b.sortOrder)
  const progress = getGroupProgress(group, completedItemIds, activeItemId)
  const isOpen = openGroups.includes(group.id)
  const activeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (items.some((item) => item.id === activeItemId)) {
      activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeItemId, items])

  if (items.length === 0) return null

  if (items.length === 1) {
    const item = items[0]
    const isActive = item.id === activeItemId
    const isCompleted = completedItemIds.has(item.id)
    const Icon = getContentIcon(item.contentType)
    return (
      <button
        ref={isActive ? activeRef : undefined}
        type="button"
        onClick={() => onSelectItem(item.id)}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60',
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
            isCompleted
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600'
              : isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground',
          )}
        >
          {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium">{group.title}</span>
        <ModuleStatusBadge {...progress} />
      </button>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={(open) => onOpenChange(group.id, open)}>
      <div className="rounded-lg border border-border/60">
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/40">
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
          />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{group.title}</span>
          <ModuleStatusBadge {...progress} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-0.5 border-t border-dashed px-2 py-2">
            {items.map((item) => {
              const isActive = item.id === activeItemId
              const isCompleted = completedItemIds.has(item.id)
              const Icon = getContentIcon(item.contentType)
              return (
                <button
                  key={item.id}
                  ref={isActive ? activeRef : undefined}
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                      isCompleted
                        ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-600'
                        : isActive
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : item.contentType === 'video' ? (
                      <Play className="h-3 w-3" fill={isActive ? 'currentColor' : 'none'} />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                </button>
              )
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export function ContentLessonSidebar({
  title,
  groups,
  activeItemId,
  activeIndex,
  total,
  onSelectItem,
  completedItemIds = new Set(),
}: ContentLessonSidebarProps) {
  const [openGroups, setOpenGroups] = useState<string[]>([])

  const sortedGroups = useMemo(() => groups, [groups])

  useEffect(() => {
    const groupWithActive = sortedGroups.find((group) => group.items.some((item) => item.id === activeItemId))
    if (groupWithActive) {
      setOpenGroups((prev) => (prev.includes(groupWithActive.id) ? prev : [...prev, groupWithActive.id]))
    }
  }, [activeItemId, sortedGroups])

  const handleOpenChange = (groupId: string, open: boolean) => {
    setOpenGroups((prev) => (open ? (prev.includes(groupId) ? prev : [...prev, groupId]) : prev.filter((id) => id !== groupId)))
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-border lg:w-[22rem] xl:w-[24rem] lg:border-r">
      <header className="shrink-0 border-b px-4 py-4">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h2>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Item {total > 0 ? activeIndex + 1 : 0} de {total}
        </p>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-3 p-3">
          {sortedGroups.map((group) => (
            <GroupAccordion
              key={group.id}
              group={group}
              activeItemId={activeItemId}
              openGroups={openGroups}
              onOpenChange={handleOpenChange}
              onSelectItem={onSelectItem}
              completedItemIds={completedItemIds}
            />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  )
}
