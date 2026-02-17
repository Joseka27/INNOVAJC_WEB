import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadsRepository } from "@/repositories/downloadsRepository";
import type {
  Download,
  InsertDownload,
  UpdateDownload,
} from "@/models/downloadsModel";

export const downloadsService = {
  async create(
    supabase: SupabaseClient,
    data: InsertDownload,
  ): Promise<Download> {
    const app_image = (data.app_image ?? "").trim();
    const title = (data.title ?? "").trim();
    const description = (data.description ?? "").trim();
    const size = (data.size ?? "").trim();
    const version = (data.version ?? "").trim();
    const file_url = (data.file_url ?? "").trim();
    const type_file = (data.type_file ?? "").trim();
    const requirements = (data.requirements ?? "").trim();

    if (!app_image) throw new Error("Imagen requerida");
    if (title.length < 2) throw new Error("Título inválido");
    if (!description) throw new Error("Descripción requerida");
    if (!size) throw new Error("Tamaño requerido");
    if (!version) throw new Error("Version requerida");
    if (!file_url) throw new Error("Archivo requerido");
    if (!type_file) throw new Error("Tipo de archivo requerido");
    if (!requirements) throw new Error("Informacion de requisitos requerido");

    return downloadsRepository(supabase).create({
      app_image,
      title,
      description,
      size,
      version,
      file_url,
      type_file,
      requirements,
    });
  },

  async list(supabase: SupabaseClient) {
    return downloadsRepository(supabase).list();
  },

  async update(supabase: SupabaseClient, id: number, patch: UpdateDownload) {
    const clean: UpdateDownload = {};

    if (patch.app_image !== undefined) {
      const v = patch.app_image.trim();
      if (!v) throw new Error("Imagen requerida");
      clean.app_image = v;
    }

    if (patch.title !== undefined) {
      const v = patch.title.trim();
      if (v.length < 2) throw new Error("Título inválido");
      clean.title = v;
    }

    if (patch.description !== undefined) {
      const v = patch.description.trim();
      if (!v) throw new Error("Descripción requerida");
      clean.description = v;
    }

    if (patch.size !== undefined) {
      const v = patch.size.trim();
      if (!v) throw new Error("Size requerido");
      clean.size = v;
    }

    if (patch.version !== undefined) {
      const v = patch.version.trim();
      if (!v) throw new Error("Version requerida");
      clean.version = v;
    }

    if (patch.file_url !== undefined) {
      const v = patch.file_url.trim();
      if (!v) throw new Error("Archivo requerido");
      clean.file_url = v;
    }

    if (patch.type_file !== undefined) {
      const v = patch.type_file.trim();
      if (!v) throw new Error("Tipo de archivo requerido");
      clean.type_file = v;
    }

    if (patch.requirements !== undefined) {
      const v = patch.requirements.trim();
      if (!v) throw new Error("Requisitos requeridos");
      clean.requirements = v;
    }

    if (Object.keys(clean).length === 0) throw new Error("Nada que actualizar");

    return downloadsRepository(supabase).update(id, clean);
  },

  async remove(supabase: SupabaseClient, id: number) {
    return downloadsRepository(supabase).remove(id);
  },
};
