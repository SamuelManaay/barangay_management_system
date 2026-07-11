import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://izllvsyzfjyxpfckshfi.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6bGx2c3l6Zmp5eHBmY2tzaGZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNTAxNDMsImV4cCI6MjA5MDgyNjE0M30.FgKA_2x-lrDQ1BWfPPNAD67OUJuoedIyfDKx9cytO24'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
