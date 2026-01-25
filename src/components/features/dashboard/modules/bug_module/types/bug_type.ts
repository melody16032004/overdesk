export interface BugData {
  title: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  steps: string;
  expected: string;
  actual: string;
  env: string;
}
