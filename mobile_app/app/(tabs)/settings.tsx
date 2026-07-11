import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../_layout'

export default function SettingsScreen() {
  const { hasStaffAccess, staffUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    barangay_name: '', municipality: '', province: '', region: '', captain_name: '', captain_position: '', contact_number: '', email: '', address: '',
  })

  useEffect(() => {
    if (!hasStaffAccess('staff')) return
    async function load() {
      setLoading(true)
      const [{ data }, { data: captainData }] = await Promise.all([
        supabase.from('barangay_settings').select('*').limit(1).single(),
        supabase.from('barangay_officials').select('residents(first_name, last_name), position').eq('position', 'Barangay Captain').eq('status', 'Active').limit(1).single(),
      ])
      if (data) {
        const captain = Array.isArray(captainData?.residents) ? captainData.residents[0] : captainData?.residents
        setForm({
          barangay_name: data.barangay_name ?? '',
          municipality: data.municipality ?? '',
          province: data.province ?? '',
          region: data.region ?? '',
          captain_name: captain ? `${captain.first_name} ${captain.last_name}` : (data.captain_name ?? ''),
          captain_position: captainData?.position ?? data.captain_position ?? 'Barangay Captain',
          contact_number: data.contact_number ?? '',
          email: data.email ?? '',
          address: data.address ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [staffUser, hasStaffAccess])

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('barangay_settings').upsert({ ...form, updated_at: new Date().toISOString() })
    setSaving(false)
    if (error) Alert.alert('Error', 'Unable to save settings right now.')
    else Alert.alert('Saved', 'Barangay settings updated.')
  }

  if (!hasStaffAccess('staff')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>Only authorized staff can access Barangay Settings.</Text></View></SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}><Text style={s.title}>Barangay Settings</Text><Text style={s.subtitle}>Manage barangay profile details</Text></View>
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color="#1e40af" /> : (
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.card}>
            <Text style={s.label}>Barangay Name</Text>
            <TextInput style={s.input} value={form.barangay_name} onChangeText={v => setForm(f => ({ ...f, barangay_name: v }))} />
            <Text style={s.label}>Municipality</Text>
            <TextInput style={s.input} value={form.municipality} onChangeText={v => setForm(f => ({ ...f, municipality: v }))} />
            <Text style={s.label}>Province</Text>
            <TextInput style={s.input} value={form.province} onChangeText={v => setForm(f => ({ ...f, province: v }))} />
            <Text style={s.label}>Region</Text>
            <TextInput style={s.input} value={form.region} onChangeText={v => setForm(f => ({ ...f, region: v }))} />
          </View>
          <View style={s.card}>
            <Text style={s.label}>Captain Name</Text>
            <TextInput style={s.input} value={form.captain_name} onChangeText={v => setForm(f => ({ ...f, captain_name: v }))} />
            <Text style={s.label}>Captain Position</Text>
            <TextInput style={s.input} value={form.captain_position} onChangeText={v => setForm(f => ({ ...f, captain_position: v }))} />
            <Text style={s.label}>Contact Number</Text>
            <TextInput style={s.input} value={form.contact_number} onChangeText={v => setForm(f => ({ ...f, contact_number: v }))} />
            <Text style={s.label}>Email</Text>
            <TextInput style={s.input} value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} />
            <Text style={s.label}>Address</Text>
            <TextInput style={s.input} value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} multiline />
            <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? 'Saving...' : 'Save Settings'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  label: { fontSize: 13, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, color: '#0f172a' },
  saveBtn: { backgroundColor: '#1e40af', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
})
