import { supabase } from "@/lib/dbClient";
import { Company, InsertCompany } from "@/models/companiesModel";

/* Companies Actions - Direct action with DB */
export const companiesRepository = {
  /* Create a Company method*/
  async create(data: InsertCompany): Promise<Company> {
    const { data: NewCompany, error } = await supabase
      .from("cc")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return NewCompany as Company;
  },

  /* Load all companyes method*/
  async getCompanies(): Promise<Company[]> {
    const { data, error } = await supabase
      .from("cc")
      .select("*")
      .order("id", { ascending: true });

    if (error) throw error;
    return data as Company[];
  },
};
