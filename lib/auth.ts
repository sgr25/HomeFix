import { createServiceClient } from '@/lib/supabase/server';

export async function getApiContext() {
  return { supabase: createServiceClient(), userId: null as string | null };
}
