import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  InsertCategory,
  Category,
  UpdateCategory,
} from "@/models/categoriesModel";

export const categoriesRepository = (supabase: SupabaseClient) => ({
  async create(data: InsertCategory): Promise<Category> {
    const { data: row, error } = await supabase
      .from("Categories")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row as Category;
  },

  async listByPage(page: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from("Categories")
      .select("*")
      .eq("page", page)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Category[];
  },

  async getById(id: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from("Categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return (data ?? null) as Category | null;
  },

  async getByPageAndName(page: string, name: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("Categories")
      .select("*")
      .eq("page", page)
      .eq("name", name)
      .single();

    if (error) return null;
    return (data ?? null) as Category | null;
  },

  async update(id: number, patch: UpdateCategory): Promise<Category> {
    const { data, error } = await supabase
      .from("Categories")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async remove(id: number) {
    const { error } = await supabase.from("Categories").delete().eq("id", id);

    if (error) throw error;
    return { id };
  },

  async countUsageInPrices(categoryName: string): Promise<number> {
    const { count, error } = await supabase
      .from("Prices")
      .select("*", { count: "exact", head: true })
      .eq("category", categoryName);

    if (error) throw error;
    return count ?? 0;
  },

  async renameUsageInPrices(oldName: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from("Prices")
      .update({ category: newName })
      .eq("category", oldName);

    if (error) throw error;
  },

  async countUsageInModules(categoryName: string): Promise<number> {
    const { count, error } = await supabase
      .from("Modules")
      .select("*", { count: "exact", head: true })
      .eq("module_category", categoryName);

    if (error) throw error;
    return count ?? 0;
  },

  async renameUsageInModules(oldName: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from("Modules")
      .update({ module_category: newName })
      .eq("module_category", oldName);

    if (error) throw error;
  },

  async countUsageInDownloads(categoryName: string): Promise<number> {
    const { count, error } = await supabase
      .from("Downloads")
      .select("*", { count: "exact", head: true })
      .eq("type_file", categoryName);

    if (error) throw error;
    return count ?? 0;
  },

  async renameUsageInDownloads(
    oldName: string,
    newName: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("Downloads")
      .update({ type_file: newName })
      .eq("type_file", oldName);

    if (error) throw error;
  },
});
