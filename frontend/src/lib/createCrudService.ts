import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export type CrudRow = Record<string, unknown> & { id: string }

type TableName = keyof Database['public']['Tables']

export function createCrudService(table: TableName) {
  return {
    async list(select = '*', orderBy: { column: string; ascending?: boolean } = { column: 'created_at', ascending: false }) {
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
      const { data, error } = await supabase.from(table).insert(values as never).select().single()
      if (error) throw error
      return data as unknown as CrudRow
    },

    async update(id: string, values: Record<string, unknown>) {
      const { data, error } = await supabase.from(table).update(values as never).eq('id', id).select().single()
      if (error) throw error
      return data as unknown as CrudRow
    },

    async remove(id: string) {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
    },
  }
}
