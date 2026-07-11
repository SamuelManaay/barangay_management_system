import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'

export default function ResidentsScreen() {
  const { hasStaffAccess, staffUser } = useAuth()
  const [residents, setResidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasStaffAccess('residents')) return
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('residents').select('id, first_name, last_name, purok, primary_contact').order('last_name', { ascending: true }).limit(50)
      setResidents(data ?? [])
      setLoading(false)
    }
    load()
  }, [staffUser, hasStaffAccess])

  if (!hasStaffAccess('residents')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>You do not have permission to view residents.</Text></View></SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Residents</Text><Text style={s.subtitle}>Latest resident records</Text></View>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color="#1e40af" /> : (
        <FlatList contentContainerStyle={s.list} data={residents} keyExtractor={item => item.id} renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.first_name} {item.last_name}</Text>
            <Text style={s.meta}>Purok {item.purok ?? '—'}</Text>
            <Text style={s.meta}>{item.primary_contact ?? 'No contact provided'}</Text>
          </View>
        )} />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  subtitle: { marginTop: 4, color: '#64748b', fontSize: 13 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  note: { marginTop: 8, color: '#64748b' },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  name: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  meta: { marginTop: 4, color: '#64748b', fontSize: 13 },
})
