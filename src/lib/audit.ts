import { supabase } from './supabase'

export async function auditLog({
  performedBy,
  action,
  module,
  target,
  changes,
}: {
  performedBy: string
  action: string
  module: string
  target: string
  changes?: Record<string, { from: unknown; to: unknown }>
}) {
  await supabase.from('audit_logs').insert({
    performed_by: performedBy,
    action,
    module,
    target,
    changes: changes ?? null,
  })
}

export function diffChanges<T extends Record<string, unknown>>(
  before: T,
  after: T,
  fields: (keyof T)[]
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const field of fields) {
    const prev = JSON.stringify(before[field])
    const next = JSON.stringify(after[field])
    if (prev !== next) changes[field as string] = { from: before[field], to: after[field] }
  }
  return changes
}
