import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InsertCategory,
  Category,
  UpdateCategory,
} from "@/models/categoriesModel";
import { categoriesRepository } from "@/repositories/categoriesRepository";

function assertPositiveInt(id: number, label = "id") {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} inválido`);
  }
}

function normalizePage(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizeCategoryName(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function requirePage(value: unknown): string {
  const v = normalizePage(value);

  if (!v) throw new Error("Página requerida");
  if (v.length > 100) throw new Error("Página inválida");

  return v;
}

function requireCategoryName(value: unknown): string {
  const v = normalizeCategoryName(value);

  if (!v) throw new Error("Nombre de categoría requerido");
  if (v.length < 2) throw new Error("Nombre de categoría inválido");
  if (v.length > 120) throw new Error("Nombre de categoría demasiado largo");

  return v;
}

async function renameUsageByPage(
  supabase: SupabaseClient,
  page: string,
  oldName: string,
  newName: string,
) {
  const repo = categoriesRepository(supabase);

  switch (page) {
    case "prices":
      await repo.renameUsageInPrices(oldName, newName);
      return;

    case "modules":
      await repo.renameUsageInModules(oldName, newName);
      return;

    case "downloads":
      await repo.renameUsageInDownloads(oldName, newName);
      return;

    default:
      throw new Error(
        `La página "${page}" no soporta renombrado de uso todavía`,
      );
  }
}

async function countUsageByPage(
  supabase: SupabaseClient,
  page: string,
  name: string,
) {
  const repo = categoriesRepository(supabase);

  switch (page) {
    case "prices":
      return repo.countUsageInPrices(name);

    case "modules":
      return repo.countUsageInModules(name);

    case "downloads":
      return repo.countUsageInDownloads(name);

    default:
      throw new Error(
        `La página "${page}" no soporta validación de uso todavía`,
      );
  }
}

export const categoriesService = {
  async create(
    supabase: SupabaseClient,
    data: InsertCategory,
  ): Promise<Category> {
    const repo = categoriesRepository(supabase);

    const page = requirePage(data.page);
    const name = requireCategoryName(data.name);

    const existing = await repo.getByPageAndName(page, name);

    if (existing) {
      throw new Error("La categoría ya existe para esta página");
    }

    return repo.create({
      page,
      name,
    });
  },

  async listByPage(
    supabase: SupabaseClient,
    page: string,
  ): Promise<Category[]> {
    const repo = categoriesRepository(supabase);
    const cleanPage = requirePage(page);

    return repo.listByPage(cleanPage);
  },

  async rename(
    supabase: SupabaseClient,
    id: number,
    patch: UpdateCategory,
  ): Promise<Category> {
    assertPositiveInt(id);

    const repo = categoriesRepository(supabase);
    const current = await repo.getById(id);

    if (!current) {
      throw new Error("Categoría no encontrada");
    }

    if (patch.name === undefined) {
      throw new Error("Nada que actualizar");
    }

    const newName = requireCategoryName(patch.name);
    const oldName = current.name;
    const page = current.page;

    if (newName === oldName) {
      return current;
    }

    const duplicated = await repo.getByPageAndName(page, newName);

    if (duplicated && duplicated.id !== id) {
      throw new Error("Ya existe una categoría con ese nombre en esta página");
    }

    await renameUsageByPage(supabase, page, oldName, newName);

    return repo.update(id, { name: newName });
  },

  async remove(supabase: SupabaseClient, id: number) {
    assertPositiveInt(id);

    const repo = categoriesRepository(supabase);
    const current = await repo.getById(id);

    if (!current) {
      throw new Error("Categoría no encontrada");
    }

    const usageCount = await countUsageByPage(
      supabase,
      current.page,
      current.name,
    );

    if (usageCount > 0) {
      throw new Error("No se puede eliminar: la categoría está en uso");
    }

    return repo.remove(id);
  },
};
