import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rxlejmnhvomwwbeivtys.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4bGVqbW5odm9td3diZWl2dHlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2NjY5NDUsImV4cCI6MjA5NzI0Mjk0NX0.f7gfCbxa2l2Jf4T13_ysIbeZU_0QJwdHb3Na6ooiees'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const resetPassword = async (email: string) => {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://ali-alhaddad.com/auth/reset-password'
  })
}
