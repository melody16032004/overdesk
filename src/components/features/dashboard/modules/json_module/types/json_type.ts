export type FieldType = "string" | "number" | "boolean" | "null";

export interface JsonFile {
  id: number;
  name: string;
  content: string;
  date: string;
}

export interface FormField {
  id: number;
  key: string;
  value: string;
  type: FieldType;
}
