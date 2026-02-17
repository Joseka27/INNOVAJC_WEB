/* Upload official files in supabase bucket (downloads) */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sube un archivo "oficial" (exe/apk/zip/dmg/etc.) al bucket PRIVADO "downloads".
 * Guarda y devuelve el path interno (NO una publicUrl).
 */
export async function uploadDownloadFile(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext = file.name.split(".").pop() || "bin";
  const safeName = file.name.replace(/[^\w.\-()+\s]/g, "_"); // suave, por si trae cosas raras
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

  // OJO: bucket privado => NO publicUrl; se descarga por signed url desde API.
  return { path };
}

/** (Opcional) si algún día guardas URLs completas y ocupas recuperar el path */
export function extractDownloadsStoragePath(anyUrl: string) {
  const u = new URL(anyUrl);
  const marker = "/storage/v1/object/public/downloads/";
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(u.pathname.slice(idx + marker.length));
}
