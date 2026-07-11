import React, { useState } from 'react'
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { AppButton } from '@/components/ui/AppButton'
import { AppInput } from '@/components/ui/AppInput'
import { useAuth } from './_layout'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

export default function StaffLogin() {
  const { enterStaffSession } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { data: users } = await supabase
      .from('app_users')
      .select('id, username, password_hash, full_name, role, is_active, permissions')
      .eq('username', username.trim().toLowerCase())
      .limit(1)

    const user = users?.[0]
    if (!user || !user.is_active) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      setError('Invalid username or password.')
      setLoading(false)
      return
    }

    const sessionUser = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      permissions: user.permissions ?? {},
    }
    await AsyncStorage.setItem('bms_user', JSON.stringify(sessionUser))
    await AsyncStorage.setItem('bms_auth', 'true')
    enterStaffSession(sessionUser)
    setLoading(false)
    router.replace('/(tabs)/dashboard')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              <Text style={styles.logo}>BMS</Text>
            </View>
            <Text style={styles.title}>Barangay Management</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <AppInput label="Username" placeholder="username" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <AppInput label="Password" placeholder="password" value={password} onChangeText={setPassword} secureTextEntry />

            <AppButton title={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} loading={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primarySoft },
  flex: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  logoWrap: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logo: { color: colors.surface, fontWeight: '700', fontSize: 28 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.textMuted, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
})
