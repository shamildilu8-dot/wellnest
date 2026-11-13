import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    !supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY'),
);

export const PRIVATE_REPORTS_BUCKET = 'wellnest-reports';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

export async function uploadPrivateReportFile(
  userId: string,
  reportId: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { error: 'Supabase storage is not configured in this environment.' };
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `${userId}/${reportId}/${safeName}`;

  const { error } = await sb.storage
    .from(PRIVATE_REPORTS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '0',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    });

  if (error) {
    return { error: error.message };
  }
  return { path: storagePath };
}

export async function createShortLivedReportLink(
  storagePath: string,
  expiresInSeconds = 60,
): Promise<{ signedUrl?: string; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { error: 'Supabase storage is not configured.' };
  }
  const { data, error } = await sb.storage
    .from(PRIVATE_REPORTS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    return { error: error?.message ?? 'Unable to generate short-lived file link.' };
  }
  return { signedUrl: data.signedUrl };
}
