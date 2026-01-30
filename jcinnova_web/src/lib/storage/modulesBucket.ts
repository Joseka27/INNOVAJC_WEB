/* Upload Images in supabase bucket */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadModuleImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext =
    file.name.split(".").pop() || "webp"; /* Get file extention or webp */
  const path = `${userId}/${crypto.randomUUID()}.${ext}`; /* Create bucket route */

  /* Load File in the bucket */
  const { error: upErr } = await supabase.storage
    .from("modules")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  /* If thers an error in upload */
  if (upErr) throw upErr;

  /* Get new bucket public image url */
  const { data } = supabase.storage.from("modules").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function extractModuleStoragePath(publicUrl: string) {
  const u = new URL(publicUrl);
  const marker = "/storage/v1/object/public/modules/";
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(u.pathname.slice(idx + marker.length));
}
