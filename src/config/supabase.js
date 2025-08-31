import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Veritabanı tabloları için tip tanımları
export const TABLES = {
  CLIENTS: 'clients',
  CONSULTANTS: 'consultants',
  DOCUMENTS: 'documents',
  TASKS: 'tasks',
  TASK_ASSIGNMENTS: 'task_assignments',
  FINANCE: 'finance',
  PAYMENTS: 'payments',
  CALENDAR: 'calendar',
  REPORTS: 'reports',
  COMPANY_SETTINGS: 'company_settings'
}

// Storage bucket'ları
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  PROFILE_PHOTOS: 'profile-photos',
  COMPANY_LOGOS: 'company-logos'
}
