import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env
  .NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY as string;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  db: { schema: "public" },
  global: { headers: { "x-my-custom-header": "my-app-name" } },
});