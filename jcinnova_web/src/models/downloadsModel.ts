//Estructura de la base de datos

export interface InsertDownload {
  app_image: string;
  title: string;
  description: string;
  size: string;
  version: string;
  file_url: string;
  type_file: string;
  requirements: string;
}

export interface Download {
  id: number;
  app_image: string;
  title: string;
  description: string;
  size: string;
  version: string;
  file_url: string;
  type_file: string;
  requirements: string;
  created_at?: string;
}

export interface UpdateDownload {
  app_image?: string;
  title?: string;
  description?: string;
  size?: string;
  version?: string;
  file_url?: string;
  type_file?: string;
  requirements?: string;
}
