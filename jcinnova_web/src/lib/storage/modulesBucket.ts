import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadModuleImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext = file.name.split(".").pop() || "webp"; //traer la extension web del archivo
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  // Sube los archivos al bucket
  const { error: upErr } = await supabase.storage
    .from("modules")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  //si hay error al subir
  if (upErr) throw upErr;

  //toma la url publica
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
