import type { Database } from '@larsana/shared'
import { supabase } from '@/lib/supabase'

export type CrudRow = Record<string, unknown> & { id: string }

type TableName = keyof Database['public']['Tables']

export function createCrudService(table: TableName) {
  return {
    async list(
      select = '*',
      orderBy: { column: string; ascending?: boolean } = { column: 'created_at', ascending: false },
    ) {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy.column, { ascending: orderBy.ascending ?? false })
      if (error) throw error
      return { data: (data ?? []) as unknown as CrudRow[], count: data?.length ?? 0 }
    },

    async getById(id: string, select = '*') {
      const { data, error } = await supabase.from(table).select(select).eq('id', id).single()
      if (error) throw error
      return data as unknown as CrudRow
    },

    async create(values: Record<string, unknown>) {
      const client = supabase as unknown as {
        from: (name: string) => {
          insert: (v: Record<string, unknown>) => {
            select: () => { single: () => Promise<{ data: unknown; error: { message: string } | null }> }
          }
        }
      }
      const { data, error } = await client.from(table as string).insert(values).select().single()
      if (error) throw error
      return data as unknown as CrudRow
    },

    async update(id: string, values: Record<string, unknown>) {
      const client = supabase as unknown as {
        from: (name: string) => {
          update: (v: Record<string, unknown>) => {
            eq: (col: string, val: string) => {
              select: () => { single: () => Promise<{ data: unknown; error: { message: string } | null }> }
            }
          }
        }
      }
      const { data, error } = await client.from(table as string).update(values).eq('id', id).select().single()
      if (error) throw error
      return data as unknown as CrudRow
    },

    async remove(id: string) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
  }
}
