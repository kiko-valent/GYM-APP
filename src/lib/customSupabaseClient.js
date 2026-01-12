import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gnxclqonizujxckbbtgb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGNscW9uaXp1anhja2JidGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyOTAzNjMsImV4cCI6MjA3Nzg2NjM2M30.sZpXEBrGouJNeKqMrRoyQsq_cpA63J5GCyrapg5NIfI';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
