// Estructura de la base de datos

export interface InsertModule {
  title: string;
  short_desc: string;
  long_desc: string;
  second_text?: string | null;
  banner_image_url: string;
  featured_image_url?: string | null;
  gallery_images: string[];
  module_category: string;
}

export interface Module {
  id: number;
  title: string;
  short_desc: string;
  long_desc: string;
  second_text: string | null;
  banner_image_url: string;
  featured_image_url: string | null;
  gallery_images: string[];
  module_category: string;
}

export interface UpdateModule {
  title?: string;
  short_desc?: string;
  long_desc?: string;
  second_text?: string | null;
  banner_image_url?: string;
  featured_image_url?: string | null;
  gallery_images?: string[];
  module_category?: string;
}
