/* Direct connection with supabase */
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Company,
  InsertCompany,
  UpdateCompany,
} from "@/models/companiesModel";

/* All companies actions */
export const companiesRepository = (supabase: SupabaseClient) => ({
  /* create method for companys */
  async createCompany(data: InsertCompany): Promise<Company> {
    const { data: row, error } = await supabase
      .from("CompaniesWorkWith")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return row as Company;
  },

  /* call all companies in DB */
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from("CompaniesWorkWith")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return (data ?? []) as Company[];
  },

  /* update company information */
  async updateCompany(id: number, patch: UpdateCompany): Promise<Company> {
    const { data, error } = await supabase
      .from("CompaniesWorkWith")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Company;
  },

  /* remove company from DB */
  async removeCompany(id: number): Promise<{ id: number }> {
    const { error } = await supabase
      .from("CompaniesWorkWith")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { id };
  },
});
