// src/api/services/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fqbwvewporqrrmwinwuh.supabase.co";
const supabaseKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxYnd2ZXdwb3JxcnJtd2lud3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjU0NDgsImV4cCI6MjA2MTgwMTQ0OH0.mKp46WupJ2bq-JtakiZcQbcyhuprowV821oLDZfS8UM";

export const supabase = createClient(supabaseUrl, supabaseKey);
