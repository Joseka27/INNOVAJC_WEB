import type { SupabaseClient } from "@supabase/supabase-js";
import type { Module, InsertModule, UpdateModule } from "@/models/modulesModel";

export const modulesRepository = (supabase: SupabaseClient) => ({
  // Crear módulo
  async createModule(data: InsertModule): Promise<Module> {
    const { data: row, error } = await supabase
      .from("PagesModules")
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    return row as Module;
  },

  // Obtener todos los módulos
  async getModules(): Promise<Module[]> {
    const { data, error } = await supabase
      .from("PagesModules")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;

    return (data ?? []).map((m) => ({
      ...m,
      gallery_images: m.gallery_images ?? [],
    })) as Module[];
  },

  // Actualizar módulo
  async updateModule(id: number, patch: UpdateModule): Promise<Module> {
    const { data, error } = await supabase
      .from("PagesModules")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      gallery_images: data.gallery_images ?? [],
    } as Module;
  },

  // Eliminar módulo
  async removeModule(id: number): Promise<{ id: number }> {
    const { error } = await supabase.from("PagesModules").delete().eq("id", id);

    if (error) throw error;

    return { id };
  },
});
