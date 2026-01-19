export interface Snippet {
  id: string;
  title: string;
  lang: string;
  code: string;
  tags: string[];
  isFavorite?: boolean; // New feature
  updatedAt: number;
}
