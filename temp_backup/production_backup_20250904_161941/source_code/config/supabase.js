import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Veritabanı tabloları için tip tanımları
export const TABLES = {
  USERS: 'users',
  CLIENTS: 'clients',
  CONSULTANTS: 'consultants',
  TASKS: 'tasks',
  TASK_ASSIGNMENTS: 'task_assignments',
  DOCUMENTS: 'documents',
  PAYMENTS: 'payments',
  SUPPORT_TICKETS: 'support_tickets',
  CALENDAR: 'calendar',
  REPORTS: 'reports',
  COMPANY_SETTINGS: 'company_settings',
  FINANCE: 'finance'
}

// Storage bucket'ları için sabitler
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  PROFILE_PHOTOS: 'profile-photos',
  COMPANY_LOGOS: 'company-logos'
}
