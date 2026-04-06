import { createClient } from "@supabase/supabase-js";

// Dán thông tin bạn vừa copy ở Bước 2 vào đây
const supabaseUrl = "https://uxkyifejvpjveuiaqojm.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4a3lpZmVqdnBqdmV1aWFxb2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNzg2OTEsImV4cCI6MjA4NDc1NDY5MX0.B62QEJxfzgxoW__rd7lC0dMUyaI3NAJF3AM3Vznrx00";

export const supabase = createClient(supabaseUrl, supabaseKey);
