import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { useAuth } from './_layout'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { AppInput } from '@/components/ui/AppInput'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

type Resident = { id: string; first_name: string; last_name: string; purok?: string }

export default function LoginScreen() {
  const { login } = useAuth()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Resident[]>([])
  const [searching, setSearching] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    AsyncStorage.getItem('bms_user').then(s => {
      if (!s) return
      router.replace('/(tabs)/dashboard')
    })
  }, [router])

  async function handleSearch(text: string) {
    setSearch(text)
    setError('')
    if (text.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase
      .from('residents')
      .select('id, first_name, last_name, purok')
      .or(`first_name.ilike.%${text}%,last_name.ilike.%${text}%`)
      .limit(10)
    setResults(data ?? [])
    setSearching(false)
  }

  async function handleSelect(r: Resident) {
    setLoggingIn(true)
    const ok = await login(r.id)
    if (!ok) setError('Could not load your profile. Please try again.')
    setLoggingIn(false)
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <View style={s.header}>
          <View style={s.logoWrap}>
            <Text style={s.logo}>🏛️</Text>
          </View>
          <Text style={s.title}>Barangay Resident Portal</Text>
          <Text style={s.subtitle}>Search your name to access services and updates.</Text>
        </View>

        <View style={s.body}>
          <View style={s.card}>
            <Text style={s.label}>Your full name</Text>
            <AppInput
              placeholder="Type your first or last name..."
              value={search}
              onChangeText={handleSearch}
              autoCorrect={false}
              autoCapitalize="words"
            />

            {searching ? <ActivityIndicator style={s.spinner} color={colors.primary} /> : null}

            {results.length > 0 ? (
              <FlatList
                data={results}
                keyExtractor={r => r.id}
                style={s.list}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity style={s.resultItem} onPress={() => handleSelect(item)} disabled={loggingIn}>
                    <View style={s.avatar}>
                      <Text style={s.avatarText}>{item.first_name[0]}</Text>
                    </View>
                    <View style={s.resultMeta}>
                      <Text style={s.resultName}>{item.last_name}, {item.first_name}</Text>
                      {item.purok ? <Text style={s.resultSub}>Purok {item.purok}</Text> : null}
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : null}

            {search.length >= 2 && !searching && results.length === 0 ? (
              <Text style={s.noResult}>No resident found. Contact the barangay office to register.</Text>
            ) : null}

            {error ? <Text style={s.error}>{error}</Text> : null}

            {loggingIn ? (
              <View style={s.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={s.loadingText}>Loading your profile...</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/staff-login')} style={s.footerLinkWrap}>
          <Text style={s.footerLink}>Officials, tanods & staff — Sign in (staff)</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: { backgroundColor: colors.primary, paddingTop: 56, paddingBottom: 32, paddingHorizontal: spacing.xl, alignItems: 'center' },
  logoWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logo: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '800', color: colors.surface, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#c7d2fe', marginTop: spacing.sm, textAlign: 'center' },
  body: { flex: 1, padding: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  label: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  spinner: { marginTop: spacing.md },
  list: { marginTop: spacing.md, maxHeight: 320 },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.surface, fontWeight: '700', fontSize: 16 },
  resultMeta: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '700', color: colors.text },
  resultSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  noResult: { marginTop: spacing.md, textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  error: { marginTop: spacing.md, color: colors.danger, textAlign: 'center', fontSize: 14 },
  loadingOverlay: { marginTop: spacing.lg, alignItems: 'center' },
  loadingText: { marginTop: spacing.sm, color: colors.primary, fontWeight: '600' },
  footerLinkWrap: { alignItems: 'center', paddingVertical: spacing.lg },
  footerLink: { textAlign: 'center', color: colors.primary, fontSize: 13, fontWeight: '700' },
})
