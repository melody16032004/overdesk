export interface Column {
  name: string;
  type: string;
  isPk?: boolean;
  isFk?: boolean;
  fkTargets?: string[];
}

export interface TableData {
  id: string;
  name: string;
  position: { x: number; y: number };
  columns: Column[];
}

export interface ERDiagram {
  id: string;
  name: string;
  tables: TableData[];
  lastModified: number;
}
