/* Rules before interact with db */
import type { SupabaseClient } from "@supabase/supabase-js";
import { modulesRepository } from "@/repositories/modulesRepository";
import type { Module, InsertModule, UpdateModule } from "@/models/modulesModel";

function assertPositiveInt(id: number, label = "id") {
  if (!Number.isInteger(id) || id <= 0) throw new Error(`${label} inválido`);
}

function normText(v: unknown): string {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
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

    const image_url = requireText(data.image_url, {
      field: "image_url",
      min: 2,
      max: 600,
      message: "Imagen requerida",
    });
    validateUrlLike(image_url, "URL de imagen");

    const module_category = requireText(data.module_category, {
      field: "module_category",
      min: 2,
      max: 80,
      message: "Categoría requerida",
    });

    return modulesRepository(supabase).createModule({
      title,
      short_desc,
      long_desc,
      image_url,
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

    if (patch.image_url !== undefined) {
      const v = requireText(patch.image_url, {
        field: "image_url",
        min: 2,
        max: 600,
        message: "Imagen requerida",
      });
      validateUrlLike(v, "URL de imagen");
      clean.image_url = v;
    }

    if (patch.module_category !== undefined) {
      clean.module_category = requireText(patch.module_category, {
        field: "module_category",
        min: 2,
        max: 80,
        message: "Categoría requerida",
      });
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
