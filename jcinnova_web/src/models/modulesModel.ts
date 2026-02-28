//Estructura de la base de datos

export interface InsertModule {
  title: string;
  short_desc: string;
  long_desc: string;
  image_url: string;
  module_category: string;
}

export interface Module {
  id: number;
  title: string;
  short_desc: string;
  long_desc: string;
  image_url: string;
  category: string;
  module_category: string;
}

export interface UpdateModule {
  title?: string;
  short_desc?: string;
  long_desc?: string;
  image_url?: string;
  module_category?: string;
}
