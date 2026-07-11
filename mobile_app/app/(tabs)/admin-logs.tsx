import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'

export default function AdminLogsScreen() {
  const { hasStaffAccess, staffUser } = useAuth()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasStaffAccess('audit_logs')) return
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('audit_logs').select('id, action, module, target, created_at').order('created_at', { ascending: false }).limit(30)
      setLogs(data ?? [])
      setLoading(false)
    }
    load()
  }, [staffUser, hasStaffAccess])

  if (!hasStaffAccess('audit_logs')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>Only authorized staff can view audit logs.</Text></View></SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Audit Logs</Text><Text style={s.subtitle}>Recent staff activity</Text></View>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color="#1e40af" /> : (
        <FlatList contentContainerStyle={s.list} data={logs} keyExtractor={item => item.id} renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.name}>{item.action} · {item.module}</Text>
            <Text style={s.meta}>{item.target}</Text>
            <Text style={s.meta}>{item.created_at}</Text>
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
