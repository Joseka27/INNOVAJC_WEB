export interface InsertPrice {
  title: string;
  description: string;
  category: string;
  characteristics: string;
}

export interface Price {
  id: number;
  title: string;
  description: string;
  category: string;
  characteristics: string;
  created_at: string;
}

export interface UpdatePrice {
  title?: string;
  description?: string;
  category?: string;
  characteristics?: string;
}
