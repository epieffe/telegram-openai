export interface ChatResponse {
  status?: number;
  message: string;
}

export interface DrawResponse {
  status?: number;
  images?: string[];
  message?: string;
}
