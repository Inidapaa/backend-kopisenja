import { createClient } from "@supabase/supabase-js";
import { environment } from "../environment.js";

// Admin client untuk upload ke Storage (menggunakan SERVICE_ROLE_KEY)
const supabaseAdmin = createClient(
  environment.supabaseUrl,
  environment.supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabaseAdmin;

