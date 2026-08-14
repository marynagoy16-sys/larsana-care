import { useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, User } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import {
  getPatientIdForCurrentUser,
  resolvePatientAvatarUrl,
  uploadPatientAvatar,
} from '@/services/patientAccount'
import { cn } from '@/lib/utils'

export function PatientAccountAvatar() {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const { profile, user, refreshProfile } = useAuth()

  const { data: patientId } = useQuery({
    queryKey: ['paciente', 'patient-id'],
    queryFn: getPatientIdForCurrentUser,
  })

  const { data: avatarSrc } = useQuery({
    queryKey: ['paciente', 'avatar', profile?.avatar_url],
    queryFn: () => resolvePatientAvatarUrl(profile?.avatar_url),
    enabled: Boolean(profile?.avatar_url),
  })

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('Sessão inválida.')
      if (!patientId) throw new Error('Paciente não vinculado à conta.')
      return uploadPatientAvatar(file, patientId, user.id)
    },
    onSuccess: async () => {
      await refreshProfile()
      await queryClient.invalidateQueries({ queryKey: ['paciente', 'avatar'] })
      toast.success('Foto de perfil atualizada.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível enviar a foto.')
    },
  })

  const hasPhoto = Boolean(profile?.avatar_url && avatarSrc)
  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null

  return (
    <div className="flex flex-col items-center -mt-3 pb-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
        className="group relative rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={hasPhoto ? 'Alterar foto de perfil' : 'Adicionar foto de perfil'}
      >
        <Avatar
          className={cn(
            'size-24 border-2',
            hasPhoto ? 'border-primary/20' : 'border-dashed border-muted-foreground/35 bg-muted/40',
          )}
        >
          {hasPhoto ? (
            <AvatarImage src={avatarSrc ?? undefined} alt="Foto de perfil" />
          ) : null}
          <AvatarFallback
            className={cn(
              'bg-muted/60 text-muted-foreground',
              hasPhoto && initials ? 'bg-primary/10 text-primary' : '',
            )}
          >
            {hasPhoto && initials ? (
              initials
            ) : (
              <User className="size-10 stroke-[1.5] text-muted-foreground/70" aria-hidden />
            )}
          </AvatarFallback>
        </Avatar>

        <span
          className={cn(
            'absolute bottom-0 right-0 flex size-8 translate-x-1 translate-y-1 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md',
            hasPhoto && 'opacity-90 group-hover:opacity-100',
          )}
          aria-hidden
        >
          <Pencil className="size-3.5" />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) upload.mutate(file)
        }}
      />
    </div>
  )
}
