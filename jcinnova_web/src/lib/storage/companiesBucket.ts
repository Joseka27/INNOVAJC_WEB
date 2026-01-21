/* Upload Images in supabase bucket */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadCompanyImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext =
    file.name.split(".").pop() || "webp"; /* Get file extention or webp */
  const path = `${userId}/${crypto.randomUUID()}.${ext}`; /* Create bucket route */

  /* Load File in the bucket */
  const { error: upErr } = await supabase.storage
    .from("companies")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  /* If thers an error in upload */
  if (upErr) throw upErr;

  /* Get new bucket public image url */
  const { data } = supabase.storage.from("companies").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function extractCompanyStoragePath(publicUrl: string) {
  /* Get file URL complete */
  const u = new URL(publicUrl);
  const marker = "/storage/v1/object/public/companies/"; /* Bucket route */
  const idx = u.pathname.indexOf(marker); /* Look for pathname index */
  if (idx === -1) return null; /* if its null, Url isnt valid */
  return decodeURIComponent(
    u.pathname.slice(idx + marker.length),
  ); /* extract path and decode it */
}
