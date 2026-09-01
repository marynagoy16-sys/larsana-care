import { supabase } from '@/lib/supabase'

export type PatientChatMessage = {
  id: string
  thread_id: string
  sender_role: 'sara' | 'paciente' | 'sistema'
  template_code: string | null
  body: string
  payload: Record<string, unknown>
  created_at: string
}

export async function getOrCreatePatientChatThread(): Promise<string> {
  const { data, error } = await supabase.rpc('patient_get_or_create_chat_thread' as never)
  if (error) throw error
  return data as string
}

export async function listPatientChatMessages(threadId: string): Promise<PatientChatMessage[]> {
  const { data, error } = await supabase
    .from('patient_chat_messages' as never)
    .select('id, thread_id, sender_role, template_code, body, payload, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as unknown as PatientChatMessage[]
}

export async function postPatientChatMessage(
  threadId: string,
  body: string,
  templateCode?: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('patient_post_chat_message' as never, {
    p_thread_id: threadId,
    p_body: body,
    p_template_code: templateCode ?? null,
    p_payload: {},
  } as never)
  if (error) throw error
  return data as string
}

export async function getPatientChatUnreadCount(): Promise<number> {
  const { data, error } = await supabase.rpc('patient_chat_unread_count' as never)
  if (error) throw error
  return (data as number) ?? 0
}

export async function markPatientChatRead(threadId?: string): Promise<void> {
  const { error } = await supabase.rpc('patient_mark_chat_read' as never, {
    p_thread_id: threadId ?? null,
  } as never)
  if (error) throw error
}

export const patientChatQueryKeys = {
  thread: ['paciente', 'chat', 'thread'] as const,
  messages: (threadId: string) => ['paciente', 'chat', 'messages', threadId] as const,
  unreadCount: ['paciente', 'chat', 'unread-count'] as const,
}
