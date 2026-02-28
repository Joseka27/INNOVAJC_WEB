/* Upload Images in supabase bucket */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadCompanyImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext = file.name.split(".").pop() || "webp"; //crea extension web
  const path = `${userId}/${crypto.randomUUID()}.${ext}`; //crear ruta del bucket

  //Carga los archivos al bucket
  const { error: upErr } = await supabase.storage
    .from("companies")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  //si hay error al subir
  if (upErr) throw upErr;

  //toma la url publica del bucket
  const { data } = supabase.storage.from("companies").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}

export function extractCompanyStoragePath(publicUrl: string) {
  //toma la url completa del archivo
  const u = new URL(publicUrl);
  const marker = "/storage/v1/object/public/companies/"; //ruta del bucket
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) return null; //que la url no sea invalida
  return decodeURIComponent(u.pathname.slice(idx + marker.length));
}
