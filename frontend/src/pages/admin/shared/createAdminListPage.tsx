import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EntityListPage } from '@/components/crud/EntityListPage'
import type { DataTableColumn } from '@/components/crud/DataTable'

interface AdminListConfig<T extends { id: string }> {
  title: string
  description?: string
  queryKey: readonly unknown[]
  queryFn: () => Promise<{ data: T[]; count: number }>
  columns: DataTableColumn<T>[]
  detailPath?: (id: string) => string
  canDelete?: boolean
  onDelete?: (id: string) => Promise<void>
  CreateDrawer?: React.ComponentType<{ open: boolean; onOpenChange: (o: boolean) => void }>
  createLabel?: string
}

export function createAdminListPage<T extends { id: string }>(config: AdminListConfig<T>) {
  return function AdminListPageComponent() {
    const navigate = useNavigate()
    const [createOpen, setCreateOpen] = useState(false)
    const CreateDrawer = config.CreateDrawer

    return (
      <>
        <EntityListPage
          title={config.title}
          description={config.description}
          queryKey={config.queryKey}
          queryFn={config.queryFn}
          columns={config.columns}
          onCreate={CreateDrawer ? () => setCreateOpen(true) : undefined}
          createLabel={config.createLabel}
          onRowClick={config.detailPath ? (r) => navigate(config.detailPath!(r.id)) : undefined}
          canDelete={config.canDelete}
          onDelete={config.onDelete}
        />
        {CreateDrawer && <CreateDrawer open={createOpen} onOpenChange={setCreateOpen} />}
      </>
    )
  }
}
