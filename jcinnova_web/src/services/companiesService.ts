/* Rules before interact with db */
import type { SupabaseClient } from "@supabase/supabase-js";
import { companiesRepository } from "@/repositories/companiesRepository";
import type {
  Company,
  InsertCompany,
  UpdateCompany,
} from "@/models/companiesModel";

function assertPositiveInt(id: number, label = "id") {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} inválido`);
  }
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
  if (url.startsWith("/")) return; // relativo permitido
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(`${fieldName} inválida`);
  }
}

export const companiesService = {
  async create(
    supabase: SupabaseClient,
    data: InsertCompany,
  ): Promise<Company> {
    const name = requireText(data.name, {
      field: "name",
      min: 2,
      max: 120,
      message: "Nombre inválido",
    });

    const description = requireText(data.description, {
      field: "description",
      min: 2,
      max: 2000,
      message: "Descripción requerida",
    });

    const image_url = requireText(data.image_url, {
      field: "image_url",
      min: 2,
      max: 600,
      message: "Imagen requerida",
    });
    validateUrlLike(image_url, "URL de imagen");

    return companiesRepository(supabase).createCompany({
      name,
      description,
      image_url,
    });
  },

  async list(supabase: SupabaseClient): Promise<Company[]> {
    return companiesRepository(supabase).getCompanies();
  },

  async update(
    supabase: SupabaseClient,
    id: number,
    patch: UpdateCompany,
  ): Promise<Company> {
    assertPositiveInt(id);

    const clean: UpdateCompany = {};

    if (patch.name !== undefined) {
      const v = requireText(patch.name, {
        field: "name",
        min: 2,
        max: 120,
        message: "Nombre inválido",
      });
      clean.name = v;
    }

    if (patch.description !== undefined) {
      const v = requireText(patch.description, {
        field: "description",
        min: 2,
        max: 2000,
        message: "Descripción requerida",
      });
      clean.description = v;
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

    if (Object.keys(clean).length === 0) {
      throw new Error("Nada que actualizar");
    }

    return companiesRepository(supabase).updateCompany(id, clean);
  },

  async remove(supabase: SupabaseClient, id: number) {
    assertPositiveInt(id);
    return companiesRepository(supabase).removeCompany(id);
  },

  async createCompany(supabase: SupabaseClient, data: InsertCompany) {
    return this.create(supabase, data);
  },
  async CompaniesList(supabase: SupabaseClient) {
    return this.list(supabase);
  },
  async updateCompany(
    supabase: SupabaseClient,
    id: number,
    patch: UpdateCompany,
  ) {
    return this.update(supabase, id, patch);
  },
  async deleteCompany(supabase: SupabaseClient, id: number) {
    return this.remove(supabase, id);
  },
};
