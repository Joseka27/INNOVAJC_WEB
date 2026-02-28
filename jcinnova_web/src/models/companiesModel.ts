//Estructura de la base de datos

export interface InsertCompany {
  name: string;
  description: string;
  image_url: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface UpdateCompany {
  name?: string;
  description?: string;
  image_url?: string;
}
