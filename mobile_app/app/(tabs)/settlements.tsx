import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'
import { useAuth } from '../_layout'

export default function SettlementsScreen() {
  const { hasStaffAccess, sessionType } = useAuth()

  if (sessionType === 'staff' && !hasStaffAccess('settlements')) {
    return (
      <SafeAreaView style={s.safe}><View style={s.container}><Text style={s.title}>Access denied</Text><Text style={s.note}>You do not have permission to view settlements.</Text></View></SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Settlements (mobile)</Text>
        <Text style={s.note}>Copied from web: /settlements</Text>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  note: { marginTop: 8, color: '#64748b' },
})
