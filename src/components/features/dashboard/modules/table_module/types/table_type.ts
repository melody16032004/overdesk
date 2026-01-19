export type ExportFormat = "html" | "markdown" | "csv" | "json";

export interface SavedTable {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
  lastModified: number;
}
