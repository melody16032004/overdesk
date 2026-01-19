export type ColumnType = "string" | "number" | "boolean" | "date";

export interface Column {
  id: string;
  name: string;
  type: ColumnType;
  isPrimary?: boolean;
}

export interface DBTable {
  id: string;
  name: string;
  columns: Column[];
  rows: any[];
}

export interface QueryResult {
  success: boolean;
  msg: string;
  data?: any[];
  newTables?: DBTable[];
}
