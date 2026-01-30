/* Direct connection with supabase */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Module, InsertModule, UpdateModule } from "@/models/modulesModel";

/* All modules actions */
export const modulesRepository = (supabase: SupabaseClient) => ({
  /* create method for modules */
  async createModule(data: InsertModule): Promise<Module> {
    const { data: row, error } = await supabase
      .from("Modules") // ⚠️ usa aquí el nombre real de tu tabla
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row as Module;
  },

  /* call all modules in DB */
  async getModules(): Promise<Module[]> {
    const { data, error } = await supabase
      .from("Modules")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Module[];
  },

  /* update module information */
  async updateModule(id: number, patch: UpdateModule): Promise<Module> {
    const { data, error } = await supabase
      .from("Modules")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Module;
  },

  /* remove module from DB */
  async removeModule(id: number): Promise<{ id: number }> {
    const { error } = await supabase.from("Modules").delete().eq("id", id);

    if (error) throw error;
    return { id };
  },
});
