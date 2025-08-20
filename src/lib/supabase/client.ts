
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('YOUR_SUPABASE_URL') || !supabaseKey || supabaseKey.includes('YOUR_SUPABASE_ANON_KEY')) {
    throw new Error('Supabase credentials are not configured correctly. Please check your .env.local file.');
  }

  if (!supabaseUrl.startsWith('http')) {
    throw new Error('The Supabase URL appears to be invalid. It should start with "http" or "https". Please check your .env.local file.');
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}
