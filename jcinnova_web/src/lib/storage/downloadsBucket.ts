/* Upload official files in supabase bucket (downloads) */
import type { SupabaseClient } from "@supabase/supabase-js";

//Guarda y devuelve el path interno

export async function uploadDownloadFile(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^\w.\-()+\s]/g, "_");
  const path = `${userId}/${crypto.randomUUID()}_${safeName}.${ext}`.replace(
    /\.([a-zA-Z0-9]+)\.\1$/,
    ".$1",
  );

  const { error: upErr } = await supabase.storage
    .from("downloads")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (upErr) throw upErr;

  return { path };
}

export function extractDownloadsStoragePath(anyUrl: string) {
  const u = new URL(anyUrl);
  const marker = "/storage/v1/object/public/downloads/";
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(u.pathname.slice(idx + marker.length));
}
