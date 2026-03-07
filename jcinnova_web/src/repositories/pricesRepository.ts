import type { SupabaseClient } from "@supabase/supabase-js";
import type { InsertPrice, Price, UpdatePrice } from "@/models/pricesModel";

export const pricesRepository = (supabase: SupabaseClient) => ({
  async create(data: InsertPrice): Promise<Price> {
    const { data: row, error } = await supabase
      .from("Prices")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row as Price;
  },

  async list(params?: {
    limit?: number;
    offset?: number;
  }): Promise<{ items: Price[]; count: number }> {
    const limit = Math.max(1, Math.min(500, Number(params?.limit ?? 50)));
    const offset = Math.max(0, Number(params?.offset ?? 0));
    const to = offset + limit - 1;

    const { data, error, count } = await supabase
      .from("Prices")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, to);

    if (error) throw error;

    return {
      items: (data ?? []) as Price[],
      count: count ?? 0,
    };
  },

  async listAll(): Promise<Price[]> {
    const { data, error } = await supabase
      .from("Prices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Price[];
  },

  async getById(id: number): Promise<Price | null> {
    const { data, error } = await supabase
      .from("Prices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return (data ?? null) as Price | null;
  },

  async update(id: number, patch: UpdatePrice): Promise<Price> {
    const { data, error } = await supabase
      .from("Prices")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Price;
  },

  async remove(id: number) {
    const { error } = await supabase.from("Prices").delete().eq("id", id);
    if (error) throw error;
    return { id };
  },
});
