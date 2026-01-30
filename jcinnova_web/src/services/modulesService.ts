/* Rules before interact with db */
import type { SupabaseClient } from "@supabase/supabase-js";
import { modulesRepository } from "@/repositories/modulesRepository";
import type { Module, InsertModule, UpdateModule } from "@/models/modulesModel";

export const modulesService = {
  /* Create module information rules */
  async createModule(
    supabase: SupabaseClient,
    data: InsertModule,
  ): Promise<Module> {
    if (!data.title || data.title.trim().length < 2) {
      throw new Error("Invalid Title");
    }

    // short description
    if (!data.short_desc || !data.short_desc.trim()) {
      throw new Error("Description is needed");
    }

    // long description
    if (!data.long_desc || !data.long_desc.trim()) {
      throw new Error("Long description is needed");
    }

    // image url
    if (!data.image_url || !data.image_url.trim()) {
      throw new Error("URL of image is needed");
    }

    // category
    if (!data.module_category || !data.module_category.trim()) {
      throw new Error("Category is needed");
    }

    return modulesRepository(supabase).createModule({
      title: data.title.trim(),
      short_desc: data.short_desc.trim(),
      long_desc: data.long_desc.trim(),
      image_url: data.image_url.trim(),
      module_category: data.module_category.trim(),
    });
  },

  async modulesList(supabase: SupabaseClient): Promise<Module[]> {
    return modulesRepository(supabase).getModules();
  },

  async updateModule(
    supabase: SupabaseClient,
    id: number,
    patch: UpdateModule,
  ): Promise<Module> {
    const clean: UpdateModule = {};

    if (patch.title !== undefined) {
      const n = patch.title.trim();
      if (n.length < 2) throw new Error("Invalid Title");
      clean.title = n;
    }

    if (patch.short_desc !== undefined) {
      const d = patch.short_desc.trim();
      if (!d) throw new Error("Description is needed");
      clean.short_desc = d;
    }

    if (patch.long_desc !== undefined) {
      const ld = patch.long_desc.trim();
      if (!ld) throw new Error("Long description is needed");
      clean.long_desc = ld;
    }

    if (patch.image_url !== undefined) {
      const u = patch.image_url.trim();
      if (!u) throw new Error("URL of image is needed");
      clean.image_url = u;
    }

    if (patch.module_category !== undefined) {
      const c = patch.module_category.trim();
      if (!c) throw new Error("Category is needed");
      clean.module_category = c;
    }

    if (Object.keys(clean).length === 0) throw new Error("No fields to update");

    return modulesRepository(supabase).updateModule(id, clean);
  },

  async deleteModule(supabase: SupabaseClient, id: number) {
    return modulesRepository(supabase).removeModule(id);
  },
};
