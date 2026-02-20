/* Rules before interact whit db */
import type { SupabaseClient } from "@supabase/supabase-js";
import { companiesRepository } from "@/repositories/companiesRepository";
import type {
  Company,
  InsertCompany,
  UpdateCompany,
} from "@/models/companiesModel";

export const companiesService = {
  /* Create company information (name and file) rules */
  async createCompany(
    supabase: SupabaseClient,
    data: InsertCompany,
  ): Promise<Company> {
    if (!data.name || data.name.trim().length < 2)
      throw new Error("Invalid Name");
    if (!data.image_url || !data.image_url.trim())
      throw new Error("URL of image is needed");
    if (!data.description || !data.description.trim())
      throw new Error("Description is needed");

    return companiesRepository(supabase).createCompany({
      name: data.name.trim(),
      description: data.description.trim(),
      image_url: data.image_url.trim(),
    });
  },

  async CompaniesList(supabase: SupabaseClient): Promise<Company[]> {
    /* Calls Repository to get all companies */
    return companiesRepository(supabase).getCompanies();
  },

  async updateCompany(
    /* Update Company */
    supabase: SupabaseClient,
    id: number,
    patch: UpdateCompany,
  ): Promise<Company> {
    /* save clean data to update */
    const clean: UpdateCompany = {};
    if (patch.name !== undefined) {
      /* Comes path name can be undefined */
      const n = patch.name.trim();
      if (n.length < 2) throw new Error("Invalid Name");
      clean.name = n;
    }
    if (patch.image_url !== undefined) {
      /* Comes path url can be undefined */
      const u = patch.image_url.trim();
      if (!u) throw new Error("URL of image is needed");
      clean.image_url = u;
    }
    if (patch.description !== undefined) {
      /* Comes path url can be undefined */
      const u = patch.description.trim();
      if (!u) throw new Error("Description is needed");
      clean.description = u;
    }

    /* If there is no information to update, reject and throw error */
    if (Object.keys(clean).length === 0) throw new Error("No fields to update");
    return companiesRepository(supabase).updateCompany(
      id,
      clean,
    ); /* Ropositry make the update */
  },

  /* Delete Compani by id number*/
  async deleteCompany(supabase: SupabaseClient, id: number) {
    return companiesRepository(supabase).removeCompany(id);
  },
};
