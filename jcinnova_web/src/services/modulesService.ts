/* Rules before interact with db */

import type { SupabaseClient } from "@supabase/supabase-js";
import { modulesRepository } from "@/repositories/modulesRepository";
import { categoriesRepository } from "@/repositories/categoriesRepository";
import type { Module, InsertModule, UpdateModule } from "@/models/modulesModel";

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

function validateGallery(images: unknown): string[] {
  if (!Array.isArray(images)) return [];

  return images
    .map((v) => normText(v))
    .filter((v) => v.length > 0)
    .slice(0, 20);
}

async function requireCategory(
  supabase: SupabaseClient,
  value: unknown,
  page = "modules",
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

export const modulesService = {
  async create(supabase: SupabaseClient, data: InsertModule): Promise<Module> {
    const title = requireText(data.title, {
      field: "title",
      min: 2,
      max: 140,
      message: "Título inválido",
    });

    const short_desc = requireText(data.short_desc, {
      field: "short_desc",
      min: 2,
      max: 280,
      message: "Descripción corta requerida",
    });

    const long_desc = requireText(data.long_desc, {
      field: "long_desc",
      min: 2,
      max: 4000,
      message: "Descripción larga requerida",
    });

    const second_text =
      data.second_text !== undefined
        ? normText(data.second_text) || null
        : null;

    const banner_image_url = requireText(data.banner_image_url, {
      field: "banner_image_url",
      min: 2,
      max: 600,
      message: "Banner requerido",
    });
    validateUrlLike(banner_image_url, "URL del banner");

    let featured_image_url: string | null = null;
    if (data.featured_image_url) {
      const v = requireText(data.featured_image_url, {
        field: "featured_image_url",
        min: 2,
        max: 600,
        message: "Imagen destacada inválida",
      });
      validateUrlLike(v, "URL de imagen destacada");
      featured_image_url = v;
    }

    const gallery_images = validateGallery(data.gallery_images);

    const module_category = await requireCategory(
      supabase,
      data.module_category,
      "modules",
    );

    return modulesRepository(supabase).createModule({
      title,
      short_desc,
      long_desc,
      second_text,
      banner_image_url,
      featured_image_url,
      gallery_images,
      module_category,
    });
  },

  async list(supabase: SupabaseClient): Promise<Module[]> {
    return modulesRepository(supabase).getModules();
  },

  async update(
    supabase: SupabaseClient,
    id: number,
    patch: UpdateModule,
  ): Promise<Module> {
    assertPositiveInt(id);

    const clean: UpdateModule = {};

    if (patch.title !== undefined) {
      clean.title = requireText(patch.title, {
        field: "title",
        min: 2,
        max: 140,
        message: "Título inválido",
      });
    }

    if (patch.short_desc !== undefined) {
      clean.short_desc = requireText(patch.short_desc, {
        field: "short_desc",
        min: 2,
        max: 280,
        message: "Descripción corta requerida",
      });
    }

    if (patch.long_desc !== undefined) {
      clean.long_desc = requireText(patch.long_desc, {
        field: "long_desc",
        min: 2,
        max: 4000,
        message: "Descripción larga requerida",
      });
    }

    if (patch.second_text !== undefined) {
      clean.second_text = normText(patch.second_text) || null;
    }

    if (patch.banner_image_url !== undefined) {
      const v = requireText(patch.banner_image_url, {
        field: "banner_image_url",
        min: 2,
        max: 600,
        message: "Banner requerido",
      });
      validateUrlLike(v, "URL del banner");
      clean.banner_image_url = v;
    }

    if (patch.featured_image_url !== undefined) {
      if (patch.featured_image_url === null) {
        clean.featured_image_url = null;
      } else {
        const v = requireText(patch.featured_image_url, {
          field: "featured_image_url",
          min: 2,
          max: 600,
          message: "Imagen destacada inválida",
        });
        validateUrlLike(v, "URL de imagen destacada");
        clean.featured_image_url = v;
      }
    }

    if (patch.gallery_images !== undefined) {
      clean.gallery_images = validateGallery(patch.gallery_images);
    }

    if (patch.module_category !== undefined) {
      clean.module_category = await requireCategory(
        supabase,
        patch.module_category,
        "modules",
      );
    }

    if (Object.keys(clean).length === 0) throw new Error("Nada que actualizar");

    return modulesRepository(supabase).updateModule(id, clean);
  },

  async remove(supabase: SupabaseClient, id: number) {
    assertPositiveInt(id);
    return modulesRepository(supabase).removeModule(id);
  },

  async createModule(supabase: SupabaseClient, data: InsertModule) {
    return this.create(supabase, data);
  },

  async modulesList(supabase: SupabaseClient) {
    return this.list(supabase);
  },

  async updateModule(
    supabase: SupabaseClient,
    id: number,
    patch: UpdateModule,
  ) {
    return this.update(supabase, id, patch);
  },

  async deleteModule(supabase: SupabaseClient, id: number) {
    return this.remove(supabase, id);
  },
};
