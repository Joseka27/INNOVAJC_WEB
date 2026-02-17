import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Download,
  InsertDownload,
  UpdateDownload,
} from "@/models/downloadsModel";

export const downloadsRepository = (supabase: SupabaseClient) => ({
  async create(data: InsertDownload): Promise<Download> {
    const { data: row, error } = await supabase
      .from("Downloads")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row as Download;
  },

  async list(): Promise<Download[]> {
    const { data, error } = await supabase
      .from("Downloads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Download[];
  },

  async getById(id: number): Promise<Download | null> {
    const { data, error } = await supabase
      .from("Downloads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return (data ?? null) as Download | null;
  },

  async update(id: number, patch: UpdateDownload): Promise<Download> {
    const { data, error } = await supabase
      .from("Downloads")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Download;
  },

  async remove(id: number) {
    const { error } = await supabase.from("Downloads").delete().eq("id", id);
    if (error) throw error;
    return { id };
  },
});
