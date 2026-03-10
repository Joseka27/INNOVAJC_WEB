import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadModuleImage(
  supabase: SupabaseClient,
  file: File,
  userId: string,
) {
  const ext = file.name.split(".").pop() || "webp";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("modules")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (upErr) throw upErr;

  const { data } = supabase.storage.from("modules").getPublicUrl(path);

  return { path, publicUrl: data.publicUrl };
}

export async function uploadModuleGalleryImages(
  supabase: SupabaseClient,
  files: File[],
  userId: string,
) {
  const results: { path: string; publicUrl: string }[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop() || "webp";
    const path = `${userId}/gallery/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("modules")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) throw error;

    const { data } = supabase.storage.from("modules").getPublicUrl(path);

    results.push({
      path,
      publicUrl: data.publicUrl,
    });
  }

  return results;
}

export async function deleteModuleImage(
  supabase: SupabaseClient,
  storagePath: string,
) {
  const { error } = await supabase.storage
    .from("modules")
    .remove([storagePath]);

  if (error) throw error;
}

export function extractModuleStoragePath(publicUrl: string) {
  const u = new URL(publicUrl);

  const marker = "/storage/v1/object/public/modules/";
  const idx = u.pathname.indexOf(marker);

  if (idx === -1) return null;

  return decodeURIComponent(u.pathname.slice(idx + marker.length));
}
