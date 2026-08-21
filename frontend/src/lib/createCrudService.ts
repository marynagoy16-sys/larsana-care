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
      const client = supabase as unknown as {
        from: (name: string) => {
          select: (s: string) => {
            eq: (col: string, val: string) => {
              single: () => Promise<{ data: unknown; error: { message: string } | null }>
            }
          }
        }
      }
      const { data, error } = await client.from(table as string).select(select).eq('id', id).single()
      if (error) throw error
      return data as unknown as CrudRow
    },

    async create(values: Record<string, unknown>) {
      // Academy tables expand Database union past TS recursion limit — use loose client for writes
      const client = supabase as unknown as {
        from: (name: string) => {
          insert: (v: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: unknown; error: { message: string } | null }> } }
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
      const client = supabase as unknown as {
        from: (name: string) => {
          delete: () => {
            eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
          }
        }
      }
      const { error } = await client.from(table as string).delete().eq('id', id)
      if (error) throw error
    },
  }
}
