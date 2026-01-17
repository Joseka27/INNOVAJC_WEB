/* The model of tables data */

/* When data is inserted */
export interface InsertCompany {
  name: string;
  image_url: string;
}

/* When data is brought back */
export interface Company {
  id: number;
  name: string;
  image_url: string;
  created: string;
}
