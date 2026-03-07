import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsertPrice, Price, UpdatePrice } from "@/models/pricesModel";
import { pricesRepository } from "@/repositories/pricesRepository";

const ALLOWED_CATEGORIES = [
  "Facturacion Servicios",
  "Puntos de Venta",
  "Despachos Contables",
  "Plantillas",
  "ERP",
] as const;

function assertPositiveInt(id: number, label = "id") {
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label} inválido`);
  }
}

function normInlineText(v: unknown): string {
  return String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normMultilineText(v: unknown): string {
  return String(v ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

function requireInlineText(
  value: unknown,
  {
    field,
    min = 1,
    max = 3000,
    message,
  }: { field: string; min?: number; max?: number; message: string },
): string {
  const v = normInlineText(value);

  if (v.length < min) throw new Error(message);
  if (v.length > max) throw new Error(`${field} excede el máximo de ${max}`);

  return v;
}

function requireMultilineText(
  value: unknown,
  {
    field,
    min = 1,
    max = 3000,
    message,
  }: { field: string; min?: number; max?: number; message: string },
): string {
  const v = normMultilineText(value);

  if (v.length < min) throw new Error(message);
  if (v.length > max) throw new Error(`${field} excede el máximo de ${max}`);

  return v;
}

function requireCategory(value: unknown): string {
  const v = normInlineText(value);

  if (!ALLOWED_CATEGORIES.includes(v as (typeof ALLOWED_CATEGORIES)[number])) {
    throw new Error("Categoría inválida");
  }

  return v;
}

export const pricesService = {
  async create(supabase: SupabaseClient, data: InsertPrice): Promise<Price> {
    const title = requireInlineText(data.title, {
      field: "title",
      min: 2,
      max: 140,
      message: "Título inválido",
    });

    const description = requireMultilineText(data.description, {
      field: "description",
      min: 2,
      max: 3000,
      message: "Descripción requerida",
    });

    const category = requireCategory(data.category);

    const characteristics = requireMultilineText(data.characteristics, {
      field: "characteristics",
      min: 2,
      max: 5000,
      message: "Características requeridas",
    });

    return pricesRepository(supabase).create({
      title,
      description,
      category,
      characteristics,
    });
  },

  async list(
    supabase: SupabaseClient,
    params?: { limit?: number; offset?: number },
  ) {
    return pricesRepository(supabase).list(params);
  },

  async listAll(supabase: SupabaseClient) {
    return pricesRepository(supabase).listAll();
  },

  async getById(supabase: SupabaseClient, id: number) {
    assertPositiveInt(id);
    return pricesRepository(supabase).getById(id);
  },

  async update(supabase: SupabaseClient, id: number, patch: UpdatePrice) {
    assertPositiveInt(id);

    const clean: UpdatePrice = {};

    if (patch.title !== undefined) {
      clean.title = requireInlineText(patch.title, {
        field: "title",
        min: 2,
        max: 140,
        message: "Título inválido",
      });
    }

    if (patch.description !== undefined) {
      clean.description = requireMultilineText(patch.description, {
        field: "description",
        min: 2,
        max: 3000,
        message: "Descripción requerida",
      });
    }

    if (patch.category !== undefined) {
      clean.category = requireCategory(patch.category);
    }

    if (patch.characteristics !== undefined) {
      clean.characteristics = requireMultilineText(patch.characteristics, {
        field: "characteristics",
        min: 2,
        max: 5000,
        message: "Características requeridas",
      });
    }

    if (Object.keys(clean).length === 0) {
      throw new Error("Nada que actualizar");
    }

    return pricesRepository(supabase).update(id, clean);
  },

  async remove(supabase: SupabaseClient, id: number) {
    assertPositiveInt(id);
    return pricesRepository(supabase).remove(id);
  },
};
