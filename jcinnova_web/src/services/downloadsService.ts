import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadsRepository } from "@/repositories/downloadsRepository";
import { categoriesRepository } from "@/repositories/categoriesRepository";
import type {
  Download,
  InsertDownload,
  UpdateDownload,
} from "@/models/downloadsModel";

function assertPositiveInt(id: number, label = "id") {
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} inválido`);
}

function normText(v: unknown): string {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategoryName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function requireText(
  value: unknown,
  {
    field,
    min = 1,
    max = 3000,
    message,
  }: { field: string; min?: number; max?: number; message: string },
): string {
  const v = normText(value);
  if (v.length < min) throw new Error(message);
  if (v.length > max) throw new Error(`${field} excede el máximo de ${max}`);
  return v;
}

function validateUrlLike(url: string, fieldName: string) {
  if (url.startsWith("/")) return;
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
  } catch {
    throw new Error(`${fieldName} inválida`);
  }
}

function normalizeVersion(v: string) {
  return v.replace(/\s+/g, "");
}

async function requireCategory(
  supabase: SupabaseClient,
  value: unknown,
  page = "downloads",
): Promise<string> {
  const v = normalizeCategoryName(value);

  if (!v) {
    throw new Error("Categoría inválida");
  }

  const found = await categoriesRepository(supabase).getByPageAndName(page, v);

  if (!found) {
    throw new Error("Categoría inválida");
  }

  return v;
}

export const downloadsService = {
  async create(
    supabase: SupabaseClient,
    data: InsertDownload,
  ): Promise<Download> {
    const app_image = requireText(data.app_image, {
      field: "app_image",
      min: 2,
      max: 600,
      message: "Imagen requerida",
    });
    validateUrlLike(app_image, "URL de imagen");

    const title = requireText(data.title, {
      field: "title",
      min: 2,
      max: 140,
      message: "Título inválido",
    });

    const description = requireText(data.description, {
      field: "description",
      min: 2,
      max: 3000,
      message: "Descripción requerida",
    });

    const size = requireText(data.size, {
      field: "size",
      min: 1,
      max: 40,
      message: "Tamaño requerido",
    });

    const version = normalizeVersion(
      requireText(data.version, {
        field: "version",
        min: 1,
        max: 40,
        message: "Versión requerida",
      }),
    );

    const file_url = requireText(data.file_url, {
      field: "file_url",
      min: 2,
      max: 800,
      message: "Archivo requerido",
    });
    validateUrlLike(file_url, "URL de archivo");

    const type_file = await requireCategory(
      supabase,
      data.type_file,
      "downloads",
    );

    const requirements = requireText(data.requirements, {
      field: "requirements",
      min: 2,
      max: 2000,
      message: "Requisitos requeridos",
    });

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
    assertPositiveInt(id);

    const clean: UpdateDownload = {};

    if (patch.app_image !== undefined) {
      const v = requireText(patch.app_image, {
        field: "app_image",
        min: 2,
        max: 600,
        message: "Imagen requerida",
      });
      validateUrlLike(v, "URL de imagen");
      clean.app_image = v;
    }

    if (patch.title !== undefined) {
      clean.title = requireText(patch.title, {
        field: "title",
        min: 2,
        max: 140,
        message: "Título inválido",
      });
    }

    if (patch.description !== undefined) {
      clean.description = requireText(patch.description, {
        field: "description",
        min: 2,
        max: 3000,
        message: "Descripción requerida",
      });
    }

    if (patch.size !== undefined) {
      clean.size = requireText(patch.size, {
        field: "size",
        min: 1,
        max: 40,
        message: "Tamaño requerido",
      });
    }

    if (patch.version !== undefined) {
      const v = normalizeVersion(
        requireText(patch.version, {
          field: "version",
          min: 1,
          max: 40,
          message: "Versión requerida",
        }),
      );
      clean.version = v;
    }

    if (patch.file_url !== undefined) {
      const v = requireText(patch.file_url, {
        field: "file_url",
        min: 2,
        max: 800,
        message: "Archivo requerido",
      });
      validateUrlLike(v, "URL de archivo");
      clean.file_url = v;
    }

    if (patch.type_file !== undefined) {
      clean.type_file = await requireCategory(
        supabase,
        patch.type_file,
        "downloads",
      );
    }

    if (patch.requirements !== undefined) {
      clean.requirements = requireText(patch.requirements, {
        field: "requirements",
        min: 2,
        max: 2000,
        message: "Requisitos requeridos",
      });
    }

    if (Object.keys(clean).length === 0) throw new Error("Nada que actualizar");

    return downloadsRepository(supabase).update(id, clean);
  },

  async remove(supabase: SupabaseClient, id: number) {
    assertPositiveInt(id);
    return downloadsRepository(supabase).remove(id);
  },
};
