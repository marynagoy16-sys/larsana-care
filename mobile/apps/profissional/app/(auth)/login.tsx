import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Eye, EyeOff } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { Logo } from '@/components/shared/Logo'
import { DevQuickLogin } from '@/components/auth/DevQuickLogin'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Preencha e-mail e senha')
      return
    }
    await performLogin(email.trim(), password)
  }

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true)
    setError(null)
    const result = await signIn(loginEmail, loginPassword)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.replace('/')
  }

  const handleQuickLogin = (loginEmail: string, loginPassword: string) => {
    setEmail(loginEmail)
    setPassword(loginPassword)
    void performLogin(loginEmail, loginPassword)
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mx-auto w-full max-w-md space-y-8">
            <Logo />

            <View className="mt-8 space-y-2">
              <Text className="font-display text-2xl font-bold text-foreground">
                Bem-vindo de volta
              </Text>
              <Text className="text-sm text-muted-foreground">Faça login na sua conta</Text>
            </View>

            <View className="mt-6 space-y-5">
              <View>
                <Text className="mb-2 text-sm font-medium text-muted-foreground">E-mail</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  placeholderTextColor="#49796B"
                  className="h-12 rounded-xl bg-muted px-4 text-base text-foreground"
                />
              </View>

              <View>
                <Text className="mb-2 text-sm font-medium text-muted-foreground">Senha</Text>
                <View className="relative">
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholder="••••••••"
                    placeholderTextColor="#49796B"
                    className="h-12 rounded-xl bg-muted px-4 pr-12 text-base text-foreground"
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-3.5"
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#49796B" />
                    ) : (
                      <Eye size={18} color="#49796B" />
                    )}
                  </Pressable>
                </View>
              </View>

              {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

              <Button onPress={handleSubmit} loading={loading} className="mt-2 w-full">
                Entrar
              </Button>

              <DevQuickLogin disabled={loading} onQuickLogin={handleQuickLogin} />
            </View>

            <Text className="text-center text-sm text-muted-foreground">
              App do Profissional Parceiro · LarsanaCare
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
