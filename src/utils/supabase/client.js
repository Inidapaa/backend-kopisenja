import { createClient } from "@supabase/supabase-js";
import { environment } from "../environment.js";

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
export default supabase;
