import { createClient } from '@supabase/supabase-js'

// 去讀取我們剛剛藏在 .env.local 裡面的金鑰
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 建立並匯出對講機 (supabase client)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)