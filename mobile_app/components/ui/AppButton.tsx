import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native'
import { colors } from '@/theme/colors'
import { radius } from '@/theme/radius'
import { spacing } from '@/theme/spacing'
import { shadows } from '@/theme/shadows'

type AppButtonProps = {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
  style?: ViewStyle
}

export function AppButton({ title, onPress, variant = 'primary', loading, style }: AppButtonProps) {
  const isSecondary = variant === 'secondary'
  const isDanger = variant === 'danger'

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary ? styles.secondary : isDanger ? styles.danger : styles.primary,
        style,
        pressed && styles.pressed,
      ]}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={isSecondary ? colors.primary : colors.surface} /> : <Text style={[styles.text, isSecondary && styles.secondaryText]}>{title}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  pressed: {
    opacity: 0.92,
  },
  text: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryText: {
    color: colors.text,
  },
})
