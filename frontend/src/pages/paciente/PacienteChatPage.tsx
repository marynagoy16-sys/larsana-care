import { useEffect, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { ChatRescheduleOffer } from '@/components/paciente/ChatRescheduleOffer'
import { ChatSchedulingOffer } from '@/components/paciente/ChatSchedulingOffer'
import { ChatSessionReminder } from '@/components/paciente/ChatSessionReminder'
import { ChatSubOffer } from '@/components/paciente/ChatSubOffer'
import { PatientChatMessageBody } from '@/components/paciente/PatientChatMessageBody'
import { cn } from '@/lib/utils'
import {
  getOrCreatePatientChatThread,
  listPatientChatMessages,
  markPatientChatRead,
  patientChatQueryKeys,
} from '@/services/patientChat'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import { listPendingSchedulingProposalsForPatient } from '@/services/scheduling'
import { listPendingSubOffersForPatient } from '@/services/sessionReschedule'
import { listSessionReminderStates } from '@/services/sessionReminderChat'
import { formatDateTime } from '@/lib/formatters'

export function PacienteChatPage() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const highlightProposalId = searchParams.get('proposal')
  const highlightRequestId = searchParams.get('request')
  const bottomRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  const { data: threadId, isLoading: threadLoading } = useQuery({
    queryKey: patientChatQueryKeys.thread,
    queryFn: getOrCreatePatientChatThread,
  })

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: patientChatQueryKeys.messages(threadId ?? ''),
    queryFn: () => listPatientChatMessages(threadId!),
    enabled: Boolean(threadId),
    refetchInterval: 30_000,
  })

  const {
    data: pendingProposals = [],
    isLoading: proposalsLoading,
    refetch: refetchProposals,
  } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals', 'chat'],
    queryFn: () => listPendingSchedulingProposalsForPatient(),
  })

  const {
    data: subOffers = [],
    isLoading: subOffersLoading,
    refetch: refetchSubOffers,
  } = useQuery({
    queryKey: ['paciente', 'sub_offers', 'chat'],
    queryFn: listPendingSubOffersForPatient,
  })

  const reminderSessionIds = useMemo(
    () =>
      messages
        .filter((message) => message.template_code === 'session_reminder_24h')
        .map((message) =>
          typeof message.payload?.session_id === 'string' ? message.payload.session_id : null,
        )
        .filter((id): id is string => Boolean(id)),
    [messages],
  )

  const { data: reminderStates = new Map(), isLoading: reminderStatesLoading } = useQuery({
    queryKey: ['paciente', 'chat', 'reminder-states', reminderSessionIds],
    queryFn: () => listSessionReminderStates(reminderSessionIds),
    enabled: reminderSessionIds.length > 0,
  })

  const initialProposals = pendingProposals.filter((p) => p.proposal_type !== 'remarcacao')
  const rescheduleProposals = pendingProposals.filter((p) => p.proposal_type === 'remarcacao')
  const chatProposals = [...initialProposals, ...rescheduleProposals]

  useEffect(() => {
    if (!threadId || messagesLoading) return
    void markPatientChatRead(threadId).then(() => {
      queryClient.setQueryData(patientChatQueryKeys.unreadCount, 0)
    })
  }, [threadId, messagesLoading, queryClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, chatProposals.length, subOffers.length])

  useEffect(() => {
    if ((!highlightProposalId && !highlightRequestId) || !highlightRef.current) return
    highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [
    highlightProposalId,
    highlightRequestId,
    chatProposals.length,
    subOffers.length,
    messagesLoading,
    proposalsLoading,
    subOffersLoading,
  ])

  const loading =
    threadLoading || messagesLoading || proposalsLoading || subOffersLoading || reminderStatesLoading

  const refreshScheduling = async () => {
    await Promise.all([
      refetchProposals(),
      refetchSubOffers(),
      queryClient.refetchQueries({ queryKey: ['paciente', 'scheduling_proposals'] }),
      queryClient.refetchQueries({ queryKey: ['paciente', 'sub_offers'] }),
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home }),
      queryClient.invalidateQueries({ queryKey: ['paciente', 'chat', 'reminder-states'] }),
      threadId
        ? queryClient.refetchQueries({ queryKey: patientChatQueryKeys.messages(threadId) })
        : Promise.resolve(),
    ])
  }

  return (
    <>
      <PageHeader>
        <div>
          <h1 className="font-display font-bold text-xl">Chat</h1>
          <p className="text-xs text-muted-foreground">Assistente Sara · Larsana Care</p>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-8">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando conversa…</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isPatient = message.sender_role === 'paciente'
                const proposalId =
                  typeof message.payload?.proposal_id === 'string'
                    ? message.payload.proposal_id
                    : null
                const linkedProposal = proposalId
                  ? chatProposals.find((proposal) => proposal.id === proposalId)
                  : null
                const requestId =
                  typeof message.payload?.request_id === 'string'
                    ? message.payload.request_id
                    : null
                const linkedSubOffer = requestId
                  ? subOffers.find((offer) => offer.id === requestId)
                  : null
                const sessionId =
                  typeof message.payload?.session_id === 'string'
                    ? message.payload.session_id
                    : null
                const reminderState = sessionId ? reminderStates.get(sessionId) : undefined

                return (
                  <div key={message.id} className="space-y-3">
                    <div className={cn('flex', isPatient ? 'justify-end' : 'justify-start')}>
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                          isPatient
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md',
                        )}
                      >
                        {!isPatient ? (
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            Sara
                          </p>
                        ) : null}
                        <PatientChatMessageBody
                          message={message}
                          className="leading-relaxed whitespace-pre-wrap"
                        />
                        <p
                          className={cn(
                            'mt-2 text-[10px] opacity-70',
                            isPatient && 'text-primary-foreground/80',
                          )}
                        >
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                    </div>

                    {message.template_code === 'session_reminder_24h' && sessionId && reminderState ? (
                      <ChatSessionReminder
                        sessionId={sessionId}
                        state={reminderState}
                        onUpdated={refreshScheduling}
                      />
                    ) : null}

                    {linkedProposal ? (
                      <div
                        ref={linkedProposal.id === highlightProposalId ? highlightRef : undefined}
                      >
                        {linkedProposal.proposal_type === 'remarcacao' ? (
                          <ChatRescheduleOffer
                            proposal={linkedProposal}
                            highlighted={linkedProposal.id === highlightProposalId}
                            onUpdated={refreshScheduling}
                          />
                        ) : (
                          <ChatSchedulingOffer
                            proposal={linkedProposal}
                            highlighted={linkedProposal.id === highlightProposalId}
                            onUpdated={refreshScheduling}
                          />
                        )}
                      </div>
                    ) : null}

                    {linkedSubOffer ? (
                      <div
                        ref={linkedSubOffer.id === highlightRequestId ? highlightRef : undefined}
                      >
                        <ChatSubOffer
                          offer={linkedSubOffer}
                          highlighted={linkedSubOffer.id === highlightRequestId}
                          onUpdated={refreshScheduling}
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {chatProposals
                .filter(
                  (proposal) =>
                    !messages.some(
                      (message) => message.payload?.proposal_id === proposal.id,
                    ),
                )
                .map((proposal) => (
                  <div
                    key={proposal.id}
                    ref={proposal.id === highlightProposalId ? highlightRef : undefined}
                  >
                    {proposal.proposal_type === 'remarcacao' ? (
                      <ChatRescheduleOffer
                        proposal={proposal}
                        highlighted={proposal.id === highlightProposalId}
                        onUpdated={refreshScheduling}
                      />
                    ) : (
                      <ChatSchedulingOffer
                        proposal={proposal}
                        highlighted={proposal.id === highlightProposalId}
                        onUpdated={refreshScheduling}
                      />
                    )}
                  </div>
                ))}

              {subOffers
                .filter(
                  (offer) =>
                    !messages.some(
                      (message) => message.payload?.request_id === offer.id,
                    ),
                )
                .map((offer) => (
                  <div
                    key={offer.id}
                    ref={offer.id === highlightRequestId ? highlightRef : undefined}
                  >
                    <ChatSubOffer
                      offer={offer}
                      highlighted={offer.id === highlightRequestId}
                      onUpdated={refreshScheduling}
                    />
                  </div>
                ))}

              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
