import React from 'react'
import { SafeAreaView, View, Text, StyleSheet } from 'react-native'

export default function CertificatesLiquidationScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>Certificates Liquidation (mobile)</Text>
        <Text style={s.note}>Copied from web: /certificates/liquidation</Text>
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
