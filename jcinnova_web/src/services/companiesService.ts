import { companiesRepository } from "@/repositories/companiesRepository";
import { Company, InsertCompany } from "@/models/companiesModel";

/* Creation and Validations */
export const companiesService = {
  /* Validate the image name, lenght and URL */
  async createCompany(data: InsertCompany): Promise<Company> {
    if (!data.name || data.name.length < 2) {
      throw new Error("Invalid Name");
    }

    if (!data.image_url) {
      throw new Error("URL of image is needed");
    }
    return companiesRepository.create(data);
  },

  /* Write all the companies in a list */
  async CompaniesList(): Promise<Company[]> {
    return companiesRepository.getCompanies();
  },
};
