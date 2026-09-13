import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Falta configurar SUPABASE_URL para conectar con Supabase.')
}

if (!serviceRoleKey) {
  throw new Error(
    'Falta configurar SUPABASE_SERVICE_ROLE_KEY para conectar con Supabase.',
  )
}

// Cliente exclusivo de código que corre en el servidor. Nunca se importa desde
// componentes del frontend: utiliza la service role key para las tools MCP.
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
