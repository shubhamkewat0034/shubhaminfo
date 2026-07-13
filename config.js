// ====================================================================
// PASTE YOUR SUPABASE PROJECT DETAILS HERE (from Settings -> API)
// ====================================================================
const SUPABASE_URL = "https://mnvnbjpqdyxfliguholy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udm5ianBxZHl4ZmxpZ3Vob2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MDQ2NTcsImV4cCI6MjA5OTQ4MDY1N30.LGL9I3br-8xqleIq0_E0iHEqlb7FB4MsuiywUYeZYK4";

// YouTube compression tutorial video ID (the part after v= in the URL)
// Example: https://www.youtube.com/watch?v=ABC123XYZ -> use "ABC123XYZ"
const COMPRESSION_VIDEO_ID = "PASTE_YOUTUBE_VIDEO_ID_HERE";

// Do not edit below this line
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);