/* When data is inserted */
export interface InsertModule {
  title: string;
  short_desc: string;
  long_desc: string;
  image_url: string;
  module_category: string;
}

/* When data is brought back */
export interface Module {
  id: number;
  title: string;
  short_desc: string;
  long_desc: string;
  image_url: string;
  category: string;
  module_category: string;
}

/* update Data */
export interface UpdateModule {
  title?: string;
  short_desc?: string;
  long_desc?: string;
  image_url?: string;
  module_category?: string;
}
