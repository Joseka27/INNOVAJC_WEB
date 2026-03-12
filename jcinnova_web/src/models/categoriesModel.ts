export interface InsertCategory {
  page: string;
  name: string;
}

export interface Category {
  id: number;
  page: string;
  name: string;
  created_at: string;
}

export interface UpdateCategory {
  name?: string;
}
