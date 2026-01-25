export type RuleType =
  | "required"
  | "email"
  | "number"
  | "string_length"
  | "number_range"
  | "enum"
  | "regex"
  | "date"
  | "url";

export type Tab = "generator" | "validator" | "testcase";
export type OutputFormat = "json" | "csv" | "sql";

export interface ValidationRule {
  id: string;
  field: string;
  type: RuleType;
  params?: string;
  active: boolean;
}

export interface ValidationResult {
  rowIndex: number;
  errors: string[];
}
