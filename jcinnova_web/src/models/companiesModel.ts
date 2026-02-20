/* The model of supabase tables */

/* When data is inserted */
export interface InsertCompany {
  name: string;
  description: string;
  image_url: string;
}

/* When data is brought back */
export interface Company {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

/* update Data */
export interface UpdateCompany {
  name?: string;
  description?: string;
  image_url?: string;
}
