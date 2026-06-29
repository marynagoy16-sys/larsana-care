import { Text, View } from 'react-native'
import { Button } from '@/components/ui/Button'
import { DEV_LOGIN_PP, isDevLoginEnabled } from '@/config/devLogin'

interface DevQuickLoginProps {
  disabled?: boolean
  onQuickLogin: (email: string, password: string) => void
}

export function DevQuickLogin({ disabled, onQuickLogin }: DevQuickLoginProps) {
  if (!isDevLoginEnabled()) return null

  return (
    <View className="mt-6 space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4">
      <View>
        <Text className="text-sm font-semibold text-foreground">Login rápido (dev)</Text>
        <Text className="text-xs text-muted-foreground">
          Usuários do seed · senha LarsanaCare2026!
        </Text>
      </View>
      <Button
        variant="outline"
        disabled={disabled}
        className="h-10 justify-start bg-card/80"
        onPress={() => onQuickLogin(DEV_LOGIN_PP.email, DEV_LOGIN_PP.password)}
      >
        {DEV_LOGIN_PP.label}
      </Button>
    </View>
  )
}
